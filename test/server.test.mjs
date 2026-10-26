import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createAppServer } from '../server.mjs';

const assetNames = ['index.html', 'styles.css', 'app.mjs', 'consultation.mjs', 'consultation-ui.mjs', 'observation-ui.mjs', 'label-check.mjs', 'catalog.json', 'guidance.json'];
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
const CONSENT = 'youcam-2026-10-26';
const result = { type: 'texture', uiScore: 68, rawScore: 42, source: 'YouCam', simulated: false };
const flush = () => new Promise((resolve) => setImmediate(resolve));

async function withServer(run, options = {}) {
  const publicDir = await mkdtemp(join(tmpdir(), 'skincare-server-test-'));
  const logs = [];
  for (const name of assetNames) await writeFile(join(publicDir, name), name.endsWith('.json') ? '[]' : `test ${name}`);
  await mkdir(join(publicDir, '.git'));
  await mkdir(join(publicDir, 'devpost'));
  await writeFile(join(publicDir, '.env'), 'PRIVATE_TEST_CONTENT');
  await writeFile(join(publicDir, '.git', 'config'), 'PRIVATE_TEST_CONTENT');
  await writeFile(join(publicDir, 'devpost', 'learner-profile.md'), 'PRIVATE_TEST_CONTENT');
  const server = createAppServer({ publicDir, logger: (entry) => logs.push(entry), ...options });
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    await run({ port: server.address().port, logs });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(publicDir, { recursive: true, force: true });
  }
}

function request(port, path, { method = 'GET', headers = {}, body, chunked = false } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let data;
        try { data = JSON.parse(text); } catch { /* Static text is not JSON. */ }
        resolve({ status: res.statusCode, headers: res.headers, body: text, data });
      });
    });
    req.on('error', reject);
    if (chunked && body) { req.write(body.subarray(0, 4)); req.write(body.subarray(4)); req.end(); }
    else req.end(body);
  });
}

const headers = (port, extra = {}) => ({ origin: `http://127.0.0.1:${port}`, 'content-type': 'image/png', 'x-youcam-consent': CONSENT, ...extra });
const create = (port, options = {}) => request(port, '/api/analysis', { method: 'POST', headers: headers(port), body: PNG, ...options });
const clear = (port, id, extra = {}) => request(port, `/api/analysis/${id}`, { method: 'DELETE', headers: { origin: `http://127.0.0.1:${port}`, ...extra } });

function fakeAdapter(overrides = {}) {
  return { start: async () => ({ taskId: 'private-provider-task' }), status: async () => ({ status: 'success', result }), ...overrides };
}
const live = (adapter, extra = {}) => ({ mode: 'live', apiKey: 'private-test-key', adapter, ...extra });

async function waitFor(condition) {
  for (let attempt = 0; attempt < 30 && !condition(); attempt += 1) await flush();
  assert.ok(condition(), 'Expected asynchronous fake-adapter stage');
}

test('static allowlist serves the approved assets and privacy headers, with empty HEAD body', async () => {
  await withServer(async ({ port }) => {
    for (const path of ['/', ...assetNames.map((name) => `/${name}`)]) {
      const response = await request(port, path);
      assert.equal(response.status, 200, path);
      assert.match(response.headers['content-type'], path.endsWith('.css') ? /text\/css/ : path.endsWith('.mjs') ? /javascript/ : path.endsWith('.json') ? /application\/json/ : /text\/html/);
      assert.equal(response.headers['x-content-type-options'], 'nosniff');
      assert.equal(response.headers['referrer-policy'], 'no-referrer');
      assert.match(response.headers['content-security-policy'], /frame-ancestors 'none'/);
      assert.equal(response.headers['access-control-allow-origin'], undefined);
      if (path.endsWith('.json')) assert.deepEqual(response.data, []);
    }
    const head = await request(port, '/', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.body, '');
    assert.ok(Number(head.headers['content-length']) > 0);
  });
});

test('config exposes only mode/readiness and fixed limits, never a credential value', async () => {
  await withServer(async ({ port }) => {
    const response = await request(port, '/api/config');
    assert.deepEqual(response.data, { mode: 'disabled', configured: false, maxImageBytes: 8_000_000, minimumShortSide: 480, pollIntervalMs: 10_000, pollWindowMs: 120_000, consentVersion: CONSENT });
    assert.equal(response.headers['cache-control'], 'no-store');
  });
  await withServer(async ({ port }) => {
    const response = await request(port, '/api/config');
    assert.equal(response.data.mode, 'live');
    assert.equal(response.data.configured, true);
    assert.doesNotMatch(response.body, /private-test-key/);
  }, live(fakeAdapter()));
});

test('private, encoded, context and traversal paths never expose source files', async () => {
  await withServer(async ({ port }) => {
    for (const path of ['/.env', '/.git/config', '/devpost/learner-profile.md', '/server.mjs', '/package.json', '/lib/youcam.mjs', '/api/context', '/context.json', '/%2eenv', '/%252eenv', '/..%2findex.html', '/a/%2e%2e/index.html', '/%00index.html', '/%zz']) {
      const response = await request(port, path);
      assert.ok([400, 404].includes(response.status), `${path}: ${response.status}`);
      assert.doesNotMatch(response.body, /PRIVATE_TEST_CONTENT|test index\.html/);
    }
  });
});

test('disabled and fixture modes reject image POSTs without invoking an adapter', async () => {
  let calls = 0;
  const adapter = fakeAdapter({ start: async () => { calls += 1; return { taskId: 'unused' }; } });
  for (const mode of ['disabled', 'fixture']) await withServer(async ({ port }) => {
    const response = await create(port);
    assert.equal(response.status, 503);
    assert.equal(response.data.error, 'observation_disabled');
    const sample = await request(port, '/api/fixture-observation');
    assert.equal(sample.status, mode === 'fixture' ? 200 : 404);
    if (mode === 'fixture') {
      assert.equal(sample.data.simulated, true);
      assert.equal(sample.data.result.source, 'Simulated fixture');
    }
  }, { mode, apiKey: 'private-test-key', adapter });
  assert.equal(calls, 0);
  await withServer(async ({ port }) => {
    assert.equal((await create(port)).status, 503);
    assert.equal((await request(port, '/api/fixture-observation')).status, 404);
  }, { mode: 'live' });
});

test('live upload requires exact local origin, consent, image media and signature, with no context query', async () => {
  let calls = 0;
  const adapter = fakeAdapter({ start: async () => { calls += 1; return { taskId: 'unused' }; } });
  await withServer(async ({ port }) => {
    assert.equal((await create(port, { headers: headers(port, { origin: 'https://untrusted.example' }) })).status, 403);
    const missingOrigin = headers(port); delete missingOrigin.origin;
    assert.equal((await create(port, { headers: missingOrigin })).status, 403);
    assert.equal((await create(port, { headers: headers(port, { 'x-youcam-consent': 'old' }) })).status, 400);
    assert.equal((await create(port, { headers: headers(port, { 'content-type': 'application/json' }), body: '{"context":"PRIVATE_TEST_CONTENT"}' })).status, 415);
    assert.equal((await create(port, { body: Buffer.from('not an image') })).status, 415);
    assert.equal((await create(port, { headers: headers(port, { 'content-encoding': 'gzip' }) })).status, 415);
    assert.equal((await request(port, '/api/analysis?context=PRIVATE_TEST_CONTENT', { method: 'POST', headers: headers(port), body: PNG })).status, 400);
    assert.equal((await create(port, { headers: headers(port, { host: 'localhost:1' }) })).status, 400);
  }, live(adapter));
  assert.equal(calls, 0);
});

test('declared and chunked bodies cannot exceed the upload bound', async () => {
  let calls = 0;
  const adapter = fakeAdapter({ start: async () => { calls += 1; return { taskId: 'unused' }; } });
  await withServer(async ({ port }) => {
    const tooLarge = Buffer.concat([PNG, Buffer.alloc(20)]);
    assert.equal((await create(port, { body: tooLarge })).status, 413);
    assert.equal((await create(port, { body: tooLarge, chunked: true })).status, 413);
  }, live(adapter, { limits: { maxImageBytes: 16 } }));
  assert.equal(calls, 0);
});

test('an interrupted local upload cannot start an adapter task or crash the server', async () => {
  let starts = 0;
  const adapter = fakeAdapter({ start: async () => { starts += 1; return { taskId: 'unused' }; } });
  await withServer(async ({ port }) => {
    const uploading = http.request({ host: '127.0.0.1', port, path: '/api/analysis', method: 'POST', headers: headers(port, { 'content-length': '100' }) });
    uploading.on('error', () => {});
    uploading.write(PNG);
    await new Promise((resolve) => setTimeout(resolve, 10));
    uploading.destroy();
    await flush(); await flush();
    assert.equal((await request(port, '/api/config')).status, 200);
    assert.equal(starts, 0);
  }, live(adapter));
});

test('live operation returns opaque identifiers, releases bytes, normalizes and caches scalar success', async () => {
  let clock = 1_000;
  let starts = 0;
  let polls = 0;
  let received;
  const adapter = fakeAdapter({
    start: async (image, options) => { starts += 1; received = image; assert.equal(options.contentType, 'image/png'); assert.deepEqual(image, PNG); return { taskId: 'PRIVATE_PROVIDER_TASK' }; },
    status: async (task) => { polls += 1; assert.equal(task, 'PRIVATE_PROVIDER_TASK'); return { status: 'success', result: { ...result, maskUrls: ['PRIVATE_PROVIDER_URL'], privateKey: 'private-test-key' } }; },
  });
  await withServer(async ({ port, logs }) => {
    const started = await create(port);
    assert.equal(started.status, 202);
    assert.equal(started.data.status, 'starting');
    assert.match(started.data.operationId, /^[0-9a-f-]{36}$/);
    const path = `/api/analysis/${started.data.operationId}`;
    await flush();
    assert.ok(received.every((byte) => byte === 0));
    assert.equal((await request(port, path)).data.status, 'running');
    assert.equal(polls, 0);
    clock += 10_000;
    const completed = await request(port, path);
    assert.equal(completed.data.status, 'success');
    assert.deepEqual(completed.data.result, result);
    assert.equal((await request(port, path)).data.status, 'success');
    assert.equal(starts, 1); assert.equal(polls, 1);
    assert.doesNotMatch(started.body + completed.body + JSON.stringify(logs), /PRIVATE_PROVIDER|private-test-key|maskUrls|taskId/);
  }, live(adapter, { now: () => clock }));
});

test('one active operation blocks duplicates, clear needs origin and aborts only local work', async () => {
  let resolveStart;
  let signal;
  let starts = 0;
  const adapter = fakeAdapter({ start: async (_image, options) => {
    starts += 1; signal = options.signal;
    return new Promise((resolve) => { resolveStart = resolve; });
  } });
  await withServer(async ({ port }) => {
    const first = await create(port);
    assert.equal(first.status, 202);
    assert.equal((await create(port)).data.error, 'analysis_in_progress');
    assert.equal((await clear(port, first.data.operationId, { origin: 'null' })).status, 403);
    const cleared = await clear(port, first.data.operationId);
    assert.equal(cleared.status, 200);
    assert.match(cleared.data.message, /does not confirm provider cancellation/);
    assert.equal(signal.aborted, true);
    assert.equal((await request(port, `/api/analysis/${first.data.operationId}`)).status, 404);
    resolveStart({ taskId: 'never-exposed' });
    await flush();
    assert.equal(starts, 1);
  }, live(adapter));
});

test('uploaded image bytes are cleared while provider task creation is still pending', async () => {
  let received;
  let finishCreation;
  const adapter = fakeAdapter({ start: async (image, options) => {
    received = image;
    assert.deepEqual(image, PNG);
    // The fake upload has completed; provider task creation has not.
    options.onStage('starting');
    return new Promise((resolve) => { finishCreation = resolve; });
  } });
  await withServer(async ({ port }) => {
    const first = await create(port);
    assert.equal(first.status, 202);
    await waitFor(() => Boolean(finishCreation));
    assert.ok(received.every((byte) => byte === 0));
    const pending = await request(port, `/api/analysis/${first.data.operationId}`);
    assert.equal(pending.data.status, 'starting');
    finishCreation({ taskId: 'private-provider-task' });
    await flush();
    assert.equal((await request(port, `/api/analysis/${first.data.operationId}`)).data.status, 'running');
  }, live(adapter));
});

test('two starts per minute remain bounded even after clearing, then reset with time', async () => {
  let clock = 1_000;
  await withServer(async ({ port }) => {
    for (let count = 0; count < 2; count += 1) {
      const response = await create(port);
      assert.equal(response.status, 202);
      await clear(port, response.data.operationId);
    }
    const throttled = await create(port);
    assert.equal(throttled.status, 429);
    assert.equal(throttled.data.error, 'local_rate_limit');
    clock += 60_001;
    assert.equal((await create(port)).status, 202);
  }, live(fakeAdapter(), { now: () => clock }));
});

test('concurrent and frequent status reads share one poll, then recover the same task after uncertainty', async () => {
  let clock = 0;
  let polls = 0;
  let resolvePoll;
  const adapter = fakeAdapter({ status: async () => {
    polls += 1;
    if (polls === 1) return new Promise((resolve) => { resolvePoll = resolve; });
    if (polls === 2) throw Object.assign(new Error('PRIVATE_PROVIDER_URL private-test-key'), { code: 'provider_timeout' });
    return { status: 'success', result };
  } });
  await withServer(async ({ port }) => {
    const first = await create(port);
    const path = `/api/analysis/${first.data.operationId}`;
    await flush(); clock = 10_000;
    const one = request(port, path); const two = request(port, path);
    await waitFor(() => polls === 1);
    resolvePoll({ status: 'running' });
    const replies = await Promise.all([one, two]);
    assert.ok(replies.every((reply) => reply.data.status === 'running'));
    await request(port, path); assert.equal(polls, 1);
    clock = 20_000;
    const uncertain = await request(port, path);
    assert.equal(uncertain.data.status, 'uncertain');
    assert.doesNotMatch(uncertain.body, /PRIVATE_PROVIDER_URL|private-test-key/);
    clock = 30_000;
    assert.equal((await request(port, path)).data.status, 'success');
    assert.equal(polls, 3);
  }, live(adapter, { now: () => clock }));
});

test('poll window reports uncertainty, same-task recovery works, TTL removes and aborts operations', async () => {
  let clock = 0;
  let signal;
  const adapter = fakeAdapter({ start: async (_image, options) => { signal = options.signal; return { taskId: 'private' }; }, status: async () => ({ status: 'running' }) });
  await withServer(async ({ port }) => {
    const first = await create(port); await flush();
    const path = `/api/analysis/${first.data.operationId}`;
    clock = 120_001;
    assert.equal((await request(port, path)).data.status, 'uncertain');
    clock = 600_001;
    assert.equal((await request(port, path)).status, 404);
    assert.equal(signal.aborted, true);
  }, live(adapter, { now: () => clock }));
});

test('uncertain creation never retries or invents a recoverable provider task', async () => {
  let starts = 0; let polls = 0;
  const adapter = fakeAdapter({
    start: async () => { starts += 1; throw Object.assign(new Error('PRIVATE_PROVIDER_URL'), { code: 'creation_uncertain', taskMayExist: true }); },
    status: async () => { polls += 1; return { status: 'running' }; },
  });
  await withServer(async ({ port }) => {
    const first = await create(port); await flush();
    const path = `/api/analysis/${first.data.operationId}`;
    for (let count = 0; count < 3; count += 1) {
      const response = await request(port, path);
      assert.equal(response.data.status, 'uncertain');
      assert.doesNotMatch(response.body, /PRIVATE_PROVIDER_URL|taskId/);
    }
    assert.equal((await create(port)).status, 429);
    assert.equal(starts, 1); assert.equal(polls, 0);
  }, live(adapter));
});

test('provider failures and invalid scores stay sanitized rather than becoming fixture success', async () => {
  for (const value of [
    { status: 'error', error: { code: 'analysis_failed', message: 'PRIVATE_PROVIDER_URL' } },
    { status: 'success', result: { ...result, uiScore: Number.NaN } },
    { status: 'success', result: { ...result, type: 'diagnosis' } },
  ]) {
    let clock = 0;
    await withServer(async ({ port }) => {
      const first = await create(port); await flush(); clock = 10_000;
      const response = await request(port, `/api/analysis/${first.data.operationId}`);
      assert.ok(['error', 'uncertain'].includes(response.data.status));
      assert.equal(response.data.result, undefined);
      assert.doesNotMatch(response.body, /PRIVATE_PROVIDER_URL|Simulated fixture/);
    }, live(fakeAdapter({ status: async () => value }), { now: () => clock }));
  }
  await withServer(async ({ port }) => {
    const first = await create(port); await flush();
    const response = await request(port, `/api/analysis/${first.data.operationId}`);
    assert.equal(response.data.status, 'error');
    assert.equal(response.data.error.code, 'provider_auth');
    assert.doesNotMatch(response.body, /private-test-key/);
  }, live(fakeAdapter({ start: async () => { throw Object.assign(new Error('private-test-key'), { code: 'provider_auth' }); } })));
});

test('safe method rejection and fixed-category logging do not reflect user input or identifiers', async () => {
  await withServer(async ({ port, logs }) => {
    await request(port, '/?sensitivity=PRIVATE_TEST_CONTENT');
    await request(port, '/api/analysis?key=PRIVATE_TEST_CONTENT', { method: 'POST', body: 'PRIVATE_TEST_CONTENT' });
    await request(port, '/PRIVATE_TEST_CONTENT');
    assert.equal((await request(port, '/', { headers: { host: 'untrusted.example' } })).status, 400);
    assert.equal((await request(port, '/', { method: 'POST', body: 'PRIVATE_TEST_CONTENT' })).status, 405);
    assert.ok(logs.every((entry) => Object.keys(entry).sort().join(',') === 'route,status'));
    assert.doesNotMatch(JSON.stringify(logs), /PRIVATE_TEST_CONTENT|sensitivity|untrusted\.example/);
  });
  const server = createAppServer({ logger: () => { throw new Error('private logger detail'); } });
  try {
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const response = await request(server.address().port, '/api/config');
    assert.equal(response.status, 200);
    assert.doesNotMatch(response.body, /private logger detail/);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
