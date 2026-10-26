const API_BASE = 'https://yce-api-01.makeupar.com';
const MAX_IMAGE_BYTES = 8_000_000;
const MAX_JSON_BYTES = 65_536;
const DEFAULT_TIMEOUTS = Object.freeze({ initialize: 15_000, upload: 30_000, create: 15_000, status: 10_000 });

const MESSAGES = Object.freeze({
  configuration_missing: 'YouCam is not configured.',
  invalid_image: 'Use a supported JPEG or PNG image within the upload limit.',
  invalid_task: 'The observation reference is invalid.',
  invalid_options: 'The observation request could not be started.',
  aborted: 'Local observation waiting was stopped.',
  provider_timeout: 'YouCam did not respond within the local waiting limit.',
  network_error: 'YouCam could not be reached.',
  provider_auth: 'YouCam access is unavailable. Check the server configuration.',
  provider_rate_limit: 'YouCam cannot accept another request right now.',
  provider_conflict: 'YouCam could not accept this request in its current state.',
  provider_request_rejected: 'YouCam could not accept this observation request.',
  provider_unavailable: 'YouCam is unavailable right now.',
  provider_response_invalid: 'YouCam returned an observation response the app could not verify.',
  upload_destination_invalid: 'YouCam returned an unsupported upload destination.',
  creation_uncertain: 'An observation task may have been created. Do not automatically start another task.',
  analysis_failed: 'YouCam could not complete this cosmetic observation.',
});

export class YouCamError extends Error {
  constructor(code, { taskMayExist = false } = {}) {
    const safeCode = Object.hasOwn(MESSAGES, code) ? code : 'provider_unavailable';
    super(MESSAGES[safeCode]);
    this.name = 'YouCamError';
    this.code = safeCode;
    this.taskMayExist = Boolean(taskMayExist);
  }
}

function failure(code, creation = false) {
  return new YouCamError(creation ? 'creation_uncertain' : code, { taskMayExist: creation });
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_+/=-]{1,2048}$/.test(value);
}

function ensureSignal(signal) {
  if (signal !== undefined && signal !== null && !(signal instanceof AbortSignal)) throw new YouCamError('invalid_options');
  if (signal?.aborted) throw new YouCamError('aborted');
}

function statusError(status, creation) {
  if (creation && status >= 500) return failure('provider_unavailable', true);
  if (status === 401 || status === 403) return new YouCamError('provider_auth');
  if (status === 429) return new YouCamError('provider_rate_limit');
  if (status === 409) return new YouCamError('provider_conflict');
  if (status >= 400 && status < 500) return new YouCamError('provider_request_rejected');
  return new YouCamError('provider_unavailable');
}

function discardBody(response) {
  try { response.body?.cancel()?.catch(() => {}); } catch { /* No response body is retained. */ }
}

async function readJson(response, creation) {
  const length = response.headers?.get?.('content-length');
  if (length !== null && length !== undefined && (!/^\d+$/.test(length) || Number(length) > MAX_JSON_BYTES)) {
    discardBody(response);
    throw failure('provider_response_invalid', creation);
  }
  if (!response.body?.getReader) throw failure('provider_response_invalid', creation);
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array) || (size += value.byteLength) > MAX_JSON_BYTES) {
        reader.cancel().catch(() => {});
        throw failure('provider_response_invalid', creation);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let body;
    try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { throw failure('provider_response_invalid', creation); }
    if (!isRecord(body) || body.status !== 200 || !isRecord(body.data)) {
      if (isRecord(body) && Number.isInteger(body.status) && body.status >= 400) throw statusError(body.status, creation);
      throw failure('provider_response_invalid', creation);
    }
    return body.data;
  } finally {
    reader.releaseLock();
  }
}

function uploadRequest(data, contentType, size) {
  if (!Array.isArray(data.files) || data.files.length !== 1) throw new YouCamError('provider_response_invalid');
  const file = data.files[0];
  if (!isRecord(file) || !validId(file.file_id) || !Array.isArray(file.requests) || file.requests.length !== 1) {
    throw new YouCamError('provider_response_invalid');
  }
  const request = file.requests[0];
  if (!isRecord(request) || request.method !== 'PUT' || !isRecord(request.headers) || typeof request.url !== 'string' || request.url.length > 8192) {
    throw new YouCamError('upload_destination_invalid');
  }
  let destination;
  try { destination = new URL(request.url); } catch { throw new YouCamError('upload_destination_invalid'); }
  // Only the documented provider-owned S3 bucket family is supported. A new host
  // requires an explicit contract review, rather than following arbitrary URLs.
  const providerStorage = /^yce-[a-z0-9-]+\.s3(?:[.-][a-z0-9-]+)*\.amazonaws\.com$/;
  if (destination.protocol !== 'https:' || destination.username || destination.password || destination.hash || (destination.port && destination.port !== '443') || !providerStorage.test(destination.hostname)) {
    throw new YouCamError('upload_destination_invalid');
  }
  const headers = {};
  const entries = Object.entries(request.headers);
  if (entries.length > 16) throw new YouCamError('upload_destination_invalid');
  const seen = new Set();
  for (const [name, value] of entries) {
    const lower = name.toLowerCase();
    const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
    if (!/^[a-z0-9-]+$/i.test(name) || seen.has(lower) || ['authorization', 'proxy-authorization', 'cookie', 'set-cookie', 'host', 'connection', 'transfer-encoding'].includes(lower) || typeof text !== 'string' || text.length > 2048 || /[\r\n]/.test(text)) {
      throw new YouCamError('upload_destination_invalid');
    }
    if ((lower === 'content-type' && text !== contentType) || (lower === 'content-length' && text !== String(size))) throw new YouCamError('upload_destination_invalid');
    seen.add(lower);
    headers[name] = text;
  }
  return { fileId: file.file_id, url: destination.href, headers };
}

function normalizeResult(data) {
  if (data.task_status === 'running') return { status: 'running' };
  if (data.task_status === 'error') {
    return { status: 'error', error: { code: 'analysis_failed', message: MESSAGES.analysis_failed } };
  }
  if (data.task_status !== 'success' || !isRecord(data.results) || !Array.isArray(data.results.output) || data.results.output.length > 32) throw new YouCamError('provider_response_invalid');
  const matching = data.results.output.filter(item => isRecord(item) && item.type === 'texture');
  if (matching.length !== 1) throw new YouCamError('provider_response_invalid');
  const item = matching[0];
  if (!Number.isFinite(item.raw_score) || item.raw_score < 1 || item.raw_score > 100 || !Number.isInteger(item.ui_score) || item.ui_score < 1 || item.ui_score > 100) throw new YouCamError('provider_response_invalid');
  return { status: 'success', result: { type: 'texture', uiScore: item.ui_score, rawScore: item.raw_score, source: 'YouCam', simulated: false } };
}

export function createYouCamAdapter({ apiKey, fetchImpl = globalThis.fetch, timeouts = {} } = {}) {
  if (typeof apiKey !== 'string' || !apiKey.trim() || /[\r\n]/.test(apiKey)) throw new YouCamError('configuration_missing');
  if (typeof fetchImpl !== 'function' || !isRecord(timeouts)) throw new YouCamError('invalid_options');
  const limits = {};
  for (const [name, fallback] of Object.entries(DEFAULT_TIMEOUTS)) {
    const value = timeouts[name] ?? fallback;
    if (!Number.isFinite(value) || value <= 0 || value > 300_000) throw new YouCamError('invalid_options');
    limits[name] = value;
  }
  const apiHeaders = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

  async function request(url, options, { phase, signal, creation = false, json = true }) {
    ensureSignal(signal);
    const controller = new AbortController();
    let timer;
    let started = false;
    let onAbort;
    const stopped = new Promise((_, reject) => {
      const stop = code => {
        controller.abort();
        reject(failure(code, creation && started));
      };
      timer = setTimeout(() => stop('provider_timeout'), limits[phase]);
      onAbort = () => stop('aborted');
      signal?.addEventListener('abort', onAbort, { once: true });
    });
    const work = (async () => {
      try {
        started = true;
        const response = await fetchImpl(url, { ...options, redirect: 'error', credentials: 'omit', signal: controller.signal });
        if (!response || !Number.isInteger(response.status)) throw failure('provider_response_invalid', creation);
        if (response.status < 200 || response.status >= 300) {
          discardBody(response);
          throw statusError(response.status, creation);
        }
        if (!json) { discardBody(response); return undefined; }
        return await readJson(response, creation);
      } catch (error) {
        if (error instanceof YouCamError) throw error;
        throw failure(controller.signal.aborted ? (signal?.aborted ? 'aborted' : 'provider_timeout') : 'network_error', creation);
      }
    })();
    try { return await Promise.race([work, stopped]); }
    finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  return Object.freeze({
    async start(imageBuffer, { contentType, signal, onStage } = {}) {
      ensureSignal(signal);
      if (!(imageBuffer instanceof Uint8Array) || imageBuffer.byteLength < 1 || imageBuffer.byteLength > MAX_IMAGE_BYTES || !['image/jpeg', 'image/png'].includes(contentType)) throw new YouCamError('invalid_image');
      if (onStage !== undefined && typeof onStage !== 'function') throw new YouCamError('invalid_options');
      const size = imageBuffer.byteLength;
      let bytes = imageBuffer;
      imageBuffer = undefined;
      const notify = async stage => {
        ensureSignal(signal);
        if (!onStage) return;
        let onAbort;
        const stopped = new Promise((_, reject) => {
          onAbort = () => reject(new YouCamError('aborted'));
          signal?.addEventListener('abort', onAbort, { once: true });
        });
        try {
          await Promise.race([Promise.resolve().then(() => onStage(stage)), stopped]);
          ensureSignal(signal);
        } catch {
          throw new YouCamError(signal?.aborted ? 'aborted' : 'invalid_options');
        } finally {
          signal?.removeEventListener('abort', onAbort);
        }
      };
      try {
        await notify('initializing');
        const metadata = await request(`${API_BASE}/s2s/v2.0/file`, { method: 'POST', headers: apiHeaders, body: JSON.stringify({ files: [{ content_type: contentType, file_name: contentType === 'image/png' ? 'scan.png' : 'scan.jpg', file_size: size }] }) }, { phase: 'initialize', signal });
        const upload = uploadRequest(metadata, contentType, size);
        await notify('uploading');
        try { await request(upload.url, { method: 'PUT', headers: upload.headers, body: bytes }, { phase: 'upload', signal, json: false }); }
        finally { bytes = undefined; }
        await notify('starting');
        const data = await request(`${API_BASE}/s2s/v2.1/task/skin-analysis`, { method: 'POST', headers: apiHeaders, body: JSON.stringify({ src_file_id: upload.fileId, dst_actions: ['texture'], format: 'json' }) }, { phase: 'create', signal, creation: true });
        if (!validId(data.task_id)) throw failure('provider_response_invalid', true);
        return { taskId: data.task_id };
      } finally { bytes = undefined; }
    },
    async status(taskId, { signal } = {}) {
      if (!validId(taskId)) throw new YouCamError('invalid_task');
      const data = await request(`${API_BASE}/s2s/v2.1/task/skin-analysis/${encodeURIComponent(taskId)}`, { method: 'GET', headers: apiHeaders }, { phase: 'status', signal });
      return normalizeResult(data);
    },
  });
}
