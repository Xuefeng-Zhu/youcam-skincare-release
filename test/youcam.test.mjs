import test from 'node:test';
import assert from 'node:assert/strict';
import { createYouCamAdapter, YouCamError } from '../lib/youcam.mjs';

const KEY = 'test-key-not-a-real-credential';
const IMAGE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const UPLOAD = 'https://yce-us.s3-accelerate.amazonaws.com/demo/scan?signature=example';
const json = (data, status = 200) => new Response(JSON.stringify({ status, data }), { status });
const metadata = (overrides = {}) => ({ files: [{ file_id: 'file/opaque+id=', requests: [{ method: 'PUT', url: UPLOAD, headers: { 'Content-Type': 'image/png', 'Content-Length': String(IMAGE.length) }, ...overrides }] }] });
const success = (item = {}) => ({ task_status: 'success', results: { output: [{ type: 'pore', raw_score: 80, ui_score: 81 }, { type: 'texture', region: 'whole', raw_score: 57.33, ui_score: 68, mask_urls: ['https://do-not-expose.invalid/face'], ...item }] } });

function sequence(responses, options = {}) {
  const calls = [];
  const adapter = createYouCamAdapter({ apiKey: KEY, ...options, fetchImpl: async (url, init) => {
    calls.push({ url, ...init });
    const next = responses.shift();
    if (typeof next === 'function') return next(url, init);
    if (next instanceof Error) throw next;
    assert.ok(next, 'Unexpected extra provider request');
    return next;
  } });
  return { adapter, calls };
}

async function expectCode(promise, code, taskMayExist = false) {
  await assert.rejects(promise, error => {
    assert.ok(error instanceof YouCamError);
    assert.equal(error.code, code);
    assert.equal(error.taskMayExist, taskMayExist);
    assert.ok(!error.message.includes(KEY));
    assert.ok(!error.message.includes(UPLOAD));
    assert.equal(error.cause, undefined);
    return true;
  });
}

test('complete flow uses fixed contract, generic metadata, safe upload headers and scalar output', async () => {
  const { adapter, calls } = sequence([json(metadata()), new Response(null, { status: 200 }), json({ task_id: 'task_123' }), json(success())]);
  const stages = [];
  assert.deepEqual(await adapter.start(IMAGE, { contentType: 'image/png', originalName: 'private-person.png', onStage: stage => stages.push(stage) }), { taskId: 'task_123' });
  assert.deepEqual(stages, ['initializing', 'uploading', 'starting']);
  assert.deepEqual(JSON.parse(calls[0].body), { files: [{ content_type: 'image/png', file_name: 'scan.png', file_size: IMAGE.length }] });
  assert.equal(calls[0].url, 'https://yce-api-01.makeupar.com/s2s/v2.0/file');
  assert.equal(calls[0].headers.Authorization, `Bearer ${KEY}`);
  assert.equal(calls[1].url, UPLOAD);
  assert.equal(calls[1].method, 'PUT');
  assert.equal(calls[1].body, IMAGE);
  assert.deepEqual(calls[1].headers, { 'Content-Type': 'image/png', 'Content-Length': String(IMAGE.length) });
  assert.deepEqual(JSON.parse(calls[2].body), { src_file_id: 'file/opaque+id=', dst_actions: ['texture'], format: 'json' });
  assert.deepEqual(await adapter.status('task_123'), { status: 'success', result: { type: 'texture', uiScore: 68, rawScore: 57.33, source: 'YouCam', simulated: false } });
  assert.equal(calls[3].url, 'https://yce-api-01.makeupar.com/s2s/v2.1/task/skin-analysis/task_123');
  for (const call of calls) { assert.equal(call.redirect, 'error'); assert.equal(call.credentials, 'omit'); }
  assert.ok(!calls[0].body.includes('private-person'));
});

test('JPEG gets a generic jpg name and task identifiers are encoded as one path segment', async () => {
  const data = metadata({ headers: {} });
  const { adapter, calls } = sequence([json(data), new Response(null, { status: 204 }), json({ task_id: 'opaque/task+=' }), json({ task_status: 'running' })]);
  await adapter.start(IMAGE, { contentType: 'image/jpeg' });
  assert.equal(JSON.parse(calls[0].body).files[0].file_name, 'scan.jpg');
  assert.deepEqual(await adapter.status('opaque/task+='), { status: 'running' });
  assert.ok(calls[3].url.endsWith('/opaque%2Ftask%2B%3D'));
});

test('provider engine errors expose a fixed error rather than provider body text', async () => {
  const { adapter } = sequence([json({ task_status: 'error', error: KEY, error_message: UPLOAD })]);
  const result = await adapter.status('task');
  assert.equal(result.status, 'error');
  assert.equal(result.error.code, 'analysis_failed');
  assert.ok(!JSON.stringify(result).includes(KEY));
  assert.ok(!JSON.stringify(result).includes(UPLOAD));
});

for (const [status, code] of [[400, 'provider_request_rejected'], [401, 'provider_auth'], [403, 'provider_auth'], [409, 'provider_conflict'], [429, 'provider_rate_limit'], [503, 'provider_unavailable']]) {
  test(`HTTP ${status} is sanitized and is not retried`, async () => {
    const { adapter, calls } = sequence([new Response(`${KEY} ${UPLOAD}`, { status })]);
    await expectCode(adapter.status('task'), code);
    assert.equal(calls.length, 1);
  });
}

for (const url of ['http://yce-us.s3-accelerate.amazonaws.com/a', 'https://127.0.0.1/a', 'https://[::1]/a', 'https://localhost/a', 'https://user:pass@yce-us.s3-accelerate.amazonaws.com/a', 'https://yce-us.s3-accelerate.amazonaws.com.evil.invalid/a', 'https://evil.invalid/a', `${UPLOAD}#fragment`]) {
  test(`unsafe signed destination is rejected: ${url}`, async () => {
    const { adapter, calls } = sequence([json(metadata({ url }))]);
    await expectCode(adapter.start(IMAGE, { contentType: 'image/png' }), 'upload_destination_invalid');
    assert.equal(calls.length, 1);
  });
}

for (const headers of [{ Authorization: `Bearer ${KEY}` }, { Cookie: KEY }, { 'Content-Length': '99999' }, { 'Content-Type': 'text/plain' }, { 'x-test': 'bad\r\nvalue' }]) {
  test(`unsafe provider upload headers are rejected: ${Object.keys(headers).join(',')}`, async () => {
    const { adapter, calls } = sequence([json(metadata({ headers }))]);
    await expectCode(adapter.start(IMAGE, { contentType: 'image/png' }), 'upload_destination_invalid');
    assert.equal(calls.length, 1);
  });
}

test('redirect rejection never follows a second upload destination or creates a task', async () => {
  const { adapter, calls } = sequence([json(metadata()), () => { throw new TypeError(`redirect to ${UPLOAD}`); }]);
  await expectCode(adapter.start(IMAGE, { contentType: 'image/png' }), 'network_error');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].redirect, 'error');
});

for (const data of [{}, { files: [] }, { files: [{ file_id: 'file', requests: [] }] }, { files: [{ file_id: '../bad', requests: [] }] }]) {
  test(`malformed initialization stops before bytes/task: ${JSON.stringify(data)}`, async () => {
    const { adapter, calls } = sequence([json(data)]);
    await expectCode(adapter.start(IMAGE, { contentType: 'image/png' }), 'provider_response_invalid');
    assert.equal(calls.length, 1);
  });
}

for (const item of [{ raw_score: null }, { raw_score: '70' }, { raw_score: 0 }, { raw_score: 101 }, { ui_score: 0 }, { ui_score: 101 }, { ui_score: 1.5 }]) {
  test(`invalid documented score is unavailable: ${JSON.stringify(item)}`, async () => {
    const { adapter } = sequence([json(success(item))]);
    await expectCode(adapter.status('task'), 'provider_response_invalid');
  });
}

test('unknown state, wrong output schema and duplicate texture are unavailable', async () => {
  for (const data of [{ task_status: 'finished' }, { task_status: 'success', results: { texture: { ui_score: 60, raw_score: 55 } } }, { task_status: 'success', results: { output: [{ type: 'pore', ui_score: 80, raw_score: 80 }] } }, { task_status: 'success', results: { output: [success().results.output[1], success().results.output[1]] } }]) {
    const { adapter } = sequence([json(data)]);
    await expectCode(adapter.status('task'), 'provider_response_invalid');
  }
});

test('bounded response and malformed JSON are rejected without leaking content', async () => {
  for (const response of [new Response('{bad'), new Response('x'.repeat(65_537)), new Response('{}', { headers: { 'Content-Length': '70000' } })]) {
    const { adapter } = sequence([response]);
    await expectCode(adapter.status('task'), 'provider_response_invalid');
  }
});

test('task creation timeout is uncertain, with one create request and no retry', async () => {
  const { adapter, calls } = sequence([json(metadata()), new Response(null), () => new Promise(() => {})], { timeouts: { create: 5 } });
  await expectCode(adapter.start(IMAGE, { contentType: 'image/png' }), 'creation_uncertain', true);
  assert.equal(calls.length, 3);
  assert.equal(calls.filter(call => call.url.endsWith('/task/skin-analysis')).length, 1);
  assert.equal(calls[2].signal.aborted, true);
});

test('transport loss, invalid task response and server error during creation are uncertain', async () => {
  for (const response of [new TypeError(`${KEY} ${UPLOAD}`), json({}), new Response('bad', { status: 503 }), new Response('{bad')]) {
    const { adapter, calls } = sequence([json(metadata()), new Response(null), response]);
    await expectCode(adapter.start(IMAGE, { contentType: 'image/png' }), 'creation_uncertain', true);
    assert.equal(calls.length, 3);
  }
});

test('known creation rejection remains a known failure without retry', async () => {
  const { adapter, calls } = sequence([json(metadata()), new Response(null), new Response('quota', { status: 429 })]);
  await expectCode(adapter.start(IMAGE, { contentType: 'image/png' }), 'provider_rate_limit');
  assert.equal(calls.length, 3);
});

test('upload and status timeouts are bounded without creating new tasks', async () => {
  const upload = sequence([json(metadata()), () => new Promise(() => {})], { timeouts: { upload: 5 } });
  await expectCode(upload.adapter.start(IMAGE, { contentType: 'image/png' }), 'provider_timeout');
  assert.equal(upload.calls.length, 2);
  const status = sequence([() => new Promise(() => {})], { timeouts: { status: 5 } });
  await expectCode(status.adapter.status('task'), 'provider_timeout');
  assert.equal(status.calls.length, 1);
});

test('initialization timeout cannot proceed to image upload', async () => {
  const { adapter, calls } = sequence([() => new Promise(() => {})], { timeouts: { initialize: 5 } });
  await expectCode(adapter.start(IMAGE, { contentType: 'image/png' }), 'provider_timeout');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].signal.aborted, true);
});

test('status timeout also bounds a response body that stops streaming', async () => {
  let stream;
  const body = new ReadableStream({ start(controller) {
    stream = controller;
    controller.enqueue(new TextEncoder().encode('{"status":200,"data":'));
  } });
  const { adapter, calls } = sequence([new Response(body)], { timeouts: { status: 5 } });
  await expectCode(adapter.status('task'), 'provider_timeout');
  assert.equal(calls[0].signal.aborted, true);
  stream.close();
});

test('abort during upload or before task dispatch creates no task', async () => {
  const uploadController = new AbortController();
  const upload = sequence([json(metadata()), () => {
    uploadController.abort();
    return new Promise(() => {});
  }]);
  await expectCode(upload.adapter.start(IMAGE, { contentType: 'image/png', signal: uploadController.signal }), 'aborted');
  assert.equal(upload.calls.length, 2);
  const beforeCreateController = new AbortController();
  const beforeCreate = sequence([json(metadata()), new Response(null)]);
  await expectCode(beforeCreate.adapter.start(IMAGE, { contentType: 'image/png', signal: beforeCreateController.signal, onStage: stage => {
    if (stage === 'starting') beforeCreateController.abort();
  } }), 'aborted');
  assert.equal(beforeCreate.calls.length, 2);
});

test('pre-aborted signal makes no request; abort during creation is uncertain', async () => {
  const before = sequence([]);
  await expectCode(before.adapter.start(IMAGE, { contentType: 'image/png', signal: AbortSignal.abort() }), 'aborted');
  assert.equal(before.calls.length, 0);
  const controller = new AbortController();
  const during = sequence([json(metadata()), new Response(null), () => { controller.abort(); return new Promise(() => {}); }]);
  await expectCode(during.adapter.start(IMAGE, { contentType: 'image/png', signal: controller.signal }), 'creation_uncertain', true);
  assert.equal(during.calls.length, 3);
});

for (const [stage, requestsBeforeAbort] of [['initializing', 0], ['uploading', 1], ['starting', 2]]) {
  test(`abort settles a pending async ${stage} callback`, { timeout: 1000 }, async () => {
    const controller = new AbortController();
    let reached;
    const ready = new Promise(resolve => { reached = resolve; });
    const { adapter, calls } = sequence([json(metadata()), new Response(null)]);
    const pending = adapter.start(IMAGE, { contentType: 'image/png', signal: controller.signal, onStage: current => {
      if (current !== stage) return;
      reached();
      return new Promise(() => {});
    } });
    await ready;
    controller.abort();
    await expectCode(pending, 'aborted');
    assert.equal(calls.length, requestsBeforeAbort);
  });
}

test('callback rejection and invalid signal are sanitized before outbound work', async () => {
  const { adapter, calls } = sequence([]);
  await expectCode(adapter.start(IMAGE, { contentType: 'image/png', onStage: async () => { throw new Error(KEY); } }), 'invalid_options');
  await expectCode(adapter.start(IMAGE, { contentType: 'image/png', signal: {} }), 'invalid_options');
  await expectCode(adapter.status('task', { signal: {} }), 'invalid_options');
  assert.equal(calls.length, 0);
});

test('invalid input, task and configuration fail before outbound calls', async () => {
  const { adapter, calls } = sequence([]);
  for (const [body, contentType] of [[Buffer.alloc(0), 'image/png'], [Buffer.alloc(8_000_001), 'image/png'], [IMAGE, 'text/plain'], ['image', 'image/png']]) await expectCode(adapter.start(body, { contentType }), 'invalid_image');
  await expectCode(adapter.status('../task'), 'invalid_task');
  assert.equal(calls.length, 0);
  assert.throws(() => createYouCamAdapter({ apiKey: '' }), { code: 'configuration_missing' });
  assert.throws(() => createYouCamAdapter({ apiKey: KEY, timeouts: { create: 0 } }), { code: 'invalid_options' });
});
