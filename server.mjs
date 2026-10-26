import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONSENT_VERSION, DEFAULT_LIMITS, RequestPolicyError, safePath, localOrigin,
  requireLocalOrigin, requireImageHeaders, readImage, safeProviderError, normalizeTextureResult,
} from './lib/request-policy.mjs';

const modulePath = fileURLToPath(import.meta.url);
const defaultPublicDir = join(dirname(modulePath), 'public');
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
  ['/consultation.mjs', ['consultation.mjs', 'text/javascript; charset=utf-8']],
  ['/consultation-ui.mjs', ['consultation-ui.mjs', 'text/javascript; charset=utf-8']],
  ['/observation-ui.mjs', ['observation-ui.mjs', 'text/javascript; charset=utf-8']],
  ['/label-check.mjs', ['label-check.mjs', 'text/javascript; charset=utf-8']],
  ['/catalog.json', ['catalog.json', 'application/json; charset=utf-8']],
  ['/guidance.json', ['guidance.json', 'application/json; charset=utf-8']],
]);
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
};
const activeStatuses = new Set(['starting', 'running', 'uncertain']);

/** Creates an unlistened server; injected adapters keep offline contract tests network-free. */
export function createAppServer({
  logger, publicDir = defaultPublicDir, mode = 'disabled', apiKey = '', adapter,
  now = Date.now, limits: overrides = {},
} = {}) {
  mode = ['disabled', 'fixture', 'live'].includes(mode) ? mode : 'disabled';
  const limits = { ...DEFAULT_LIMITS, ...overrides };
  for (const value of Object.values(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError('Limits must be positive integers.');
  }
  const configured = typeof apiKey === 'string' && apiKey.trim().length > 0;
  const operations = new Map();
  let starts = [];
  let receiving = 0;

  const forget = (operation) => {
    operation.controller.abort();
    clearTimeout(operation.timer);
    operations.delete(operation.id);
  };
  const prune = () => {
    for (const operation of operations.values()) if (operation.expiresAt <= now()) forget(operation);
    starts = starts.filter((time) => now() - time < limits.startWindowMs);
  };
  const snapshot = (operation) => ({
    operationId: operation.id,
    status: operation.status,
    ...(operation.result ? { result: operation.result } : {}),
    ...(operation.error ? { error: operation.error } : {}),
    pollAfterMs: limits.pollIntervalMs,
    expiresAt: operation.expiresAt,
  });
  const startOperation = async (operation, image, contentType) => {
    try {
      const value = await adapter.start(image, {
        contentType,
        signal: operation.controller.signal,
        onStage: (stage) => { if (stage === 'starting') image.fill(0); },
      });
      if (!operations.has(operation.id)) return;
      if (typeof value?.taskId !== 'string' || !value.taskId || value.taskId.length > 256) {
        throw Object.assign(new Error('Invalid task response'), { code: 'provider_response_invalid', taskMayExist: true });
      }
      operation.taskId = value.taskId;
      operation.status = 'running';
    } catch (error) {
      if (operations.has(operation.id)) {
        operation.status = error?.taskMayExist ? 'uncertain' : 'error';
        operation.error = safeProviderError(error, operation.status === 'uncertain');
      }
    } finally {
      image.fill(0);
    }
  };
  const pollOperation = async (operation) => {
    if (!operation.taskId || !activeStatuses.has(operation.status)) return;
    if (operation.polling) return operation.polling;
    if (now() < operation.nextPollAt) return;
    operation.nextPollAt = now() + limits.pollIntervalMs;
    operation.polling = (async () => {
      try {
        const value = await adapter.status(operation.taskId, { signal: operation.controller.signal });
        if (!operations.has(operation.id)) return;
        if (value?.status === 'success') {
          const result = normalizeTextureResult(value.result);
          if (!result) throw Object.assign(new Error('Invalid result'), { code: 'provider_response_invalid' });
          operation.result = result;
          operation.status = 'success';
          delete operation.error;
        } else if (value?.status === 'error') {
          operation.status = 'error';
          operation.error = safeProviderError(value.error);
        } else if (value?.status === 'running') {
          operation.status = now() - operation.createdAt >= limits.pollWindowMs ? 'uncertain' : 'running';
          if (operation.status === 'uncertain') operation.error = safeProviderError(null, true);
          else delete operation.error;
        } else throw Object.assign(new Error('Invalid status'), { code: 'provider_response_invalid' });
      } catch (error) {
        if (operations.has(operation.id)) {
          operation.status = 'uncertain';
          operation.error = safeProviderError(error, true);
        }
      } finally {
        operation.polling = null;
      }
    })();
    return operation.polling;
  };

  const server = http.createServer({
    maxHeaderSize: 8 * 1024, headersTimeout: 10_000, requestTimeout: 30_000, keepAliveTimeout: 5_000,
  }, async (request, response) => {
    // A client abort can emit an error after the upload reader removes its listeners.
    request.on('error', () => {});
    const send = (status, body, type, route, extraHeaders = {}) => {
      if (response.destroyed || response.writableEnded) return;
      const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
      response.writeHead(status, { ...securityHeaders, 'Content-Type': type, 'Content-Length': bytes.length, ...extraHeaders });
      response.end(request.method === 'HEAD' ? undefined : bytes);
      if (logger) { try { logger({ route, status }); } catch { /* Never expose logger failures. */ } }
    };
    const json = (status, value, route, headers) => send(status, JSON.stringify(value), 'application/json; charset=utf-8', route, headers);
    const reject = (status, code, message, route = 'rejected') => json(status, { error: code, message }, route, { Connection: 'close' });

    try {
      prune();
      const origin = localOrigin(request, server.address()?.port);
      if (!origin) return reject(400, 'invalid_host', 'Use the local app address.');
      const pathname = safePath(request.url);
      if (pathname === null) return reject(400, 'invalid_path', 'This request is not supported.');
      if (pathname.startsWith('/api/') && request.url.includes('?')) return reject(400, 'unexpected_query', 'API query data is not accepted.');

      if (pathname === '/api/config' && ['GET', 'HEAD'].includes(request.method)) {
        return json(200, { mode, configured, maxImageBytes: limits.maxImageBytes, minimumShortSide: 480,
          pollIntervalMs: limits.pollIntervalMs, pollWindowMs: limits.pollWindowMs, consentVersion: CONSENT_VERSION }, 'config');
      }
      if (pathname === '/api/fixture-observation' && request.method === 'GET' && mode === 'fixture') {
        return json(200, { mode: 'fixture', simulated: true, result: {
          type: 'texture', uiScore: 68, rawScore: 42, source: 'Simulated fixture', simulated: true,
        } }, 'fixture');
      }
      if (pathname === '/api/analysis' && request.method === 'POST') {
        if (mode !== 'live') return reject(503, 'observation_disabled', mode === 'fixture'
          ? 'Fixture mode accepts no photos. No photo was sent to YouCam.'
          : 'Skin observation is not connected. No photo was sent to YouCam.', 'analysis-disabled');
        if (!configured || !adapter) return reject(503, 'not_configured', 'Live analysis is not configured.', 'analysis-disabled');
        requireLocalOrigin(request, origin);
        if (request.headers['x-youcam-consent'] !== CONSENT_VERSION) return reject(400, 'consent_required', 'Read the notice and explicitly consent before analyzing a photo.');
        const contentType = requireImageHeaders(request, limits.maxImageBytes);
        const active = [...operations.values()].filter((operation) => activeStatuses.has(operation.status)).length;
        if (active + receiving >= 1) return reject(429, 'analysis_in_progress', 'One analysis is already active. Check or clear it before starting another.');
        if (starts.length >= limits.maxStartsPerMinute) return reject(429, 'local_rate_limit', 'Wait before starting another analysis.');
        receiving += 1;
        let image;
        try { image = await readImage(request, limits.maxImageBytes, contentType); }
        finally { receiving -= 1; }
        const createdAt = now();
        const operation = { id: randomUUID(), status: 'starting', createdAt,
          expiresAt: createdAt + limits.operationTtlMs, nextPollAt: createdAt + limits.pollIntervalMs,
          controller: new AbortController() };
        operation.timer = setTimeout(() => forget(operation), limits.operationTtlMs);
        operation.timer.unref();
        operations.set(operation.id, operation);
        starts.push(createdAt);
        json(202, { operationId: operation.id, status: 'starting', pollAfterMs: limits.pollIntervalMs }, 'analysis-create');
        void startOperation(operation, image, contentType);
        return;
      }

      const operationRoute = pathname.match(/^\/api\/analysis\/([0-9a-f-]{36})$/u);
      if (operationRoute && ['GET', 'DELETE'].includes(request.method)) {
        const operation = operations.get(operationRoute[1]);
        if (!operation) return reject(404, 'analysis_not_found', 'This local analysis is unavailable or expired.', 'analysis-status');
        if (request.method === 'DELETE') {
          requireLocalOrigin(request, origin);
          forget(operation);
          return json(200, { cleared: true, message: 'Local work cleared. This does not confirm provider cancellation or deletion.' }, 'analysis-clear');
        }
        await pollOperation(operation);
        if (!operations.has(operation.id)) return reject(404, 'analysis_not_found', 'This local analysis is unavailable or expired.', 'analysis-status');
        return json(200, snapshot(operation), 'analysis-status');
      }

      if (!['GET', 'HEAD'].includes(request.method)) {
        return json(405, { error: 'method_not_allowed', message: 'This method is not supported.' }, 'rejected', { Allow: 'GET, HEAD', Connection: 'close' });
      }
      const asset = assets.get(pathname);
      if (!asset) return reject(404, 'not_found', 'This resource is not available.', 'not-found');
      try { return send(200, await readFile(join(publicDir, asset[0])), asset[1], 'asset'); }
      catch (error) { return reject(error.code === 'ENOENT' ? 404 : 500, 'asset_unavailable', 'This app resource is not available.', 'asset-unavailable'); }
    } catch (error) {
      if (error instanceof RequestPolicyError) return reject(error.status, error.code, error.message);
      return reject(500, 'request_failed', 'The local request could not be completed.');
    }
  });
  server.on('close', () => { for (const operation of operations.values()) forget(operation); });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const port = process.env.PORT === undefined ? 8787 : Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('PORT must be an integer between 1 and 65535.');
    process.exitCode = 1;
  } else {
    const mode = ['live', 'fixture'].includes(process.env.YOUCAM_MODE) ? process.env.YOUCAM_MODE : 'disabled';
    const apiKey = process.env.YOUCAM_API_KEY ?? '';
    let adapter;
    if (mode === 'live' && apiKey.trim()) {
      const { createYouCamAdapter } = await import('./lib/youcam.mjs');
      adapter = createYouCamAdapter({ apiKey });
    }
    const server = createAppServer({ mode, apiKey, adapter });
    server.once('error', (error) => {
      console.error(error.code === 'EADDRINUSE'
        ? `Port ${port} is occupied. Choose another PORT; do not stop unrelated apps.`
        : 'The local server could not start.');
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => {
      console.log(`Local prototype: http://127.0.0.1:${port}/`);
      console.log(`Observation mode: ${mode}. Startup makes no YouCam request.`);
    });
  }
}
