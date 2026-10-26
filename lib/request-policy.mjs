export const CONSENT_VERSION = 'youcam-2026-10-26';
export const DEFAULT_LIMITS = Object.freeze({
  maxImageBytes: 8_000_000,
  operationTtlMs: 600_000,
  pollIntervalMs: 10_000,
  pollWindowMs: 120_000,
  maxStartsPerMinute: 2,
  startWindowMs: 60_000,
});

export class RequestPolicyError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function safePath(target) {
  if (!target?.startsWith('/') || target.startsWith('//')) return null;
  try {
    const pathname = decodeURIComponent(target.split('?', 1)[0]);
    if (/[\u0000-\u001f\u007f\\]/u.test(pathname)) return null;
    if (pathname.split('/').some((part) => part === '.' || part === '..')) return null;
    return pathname;
  } catch {
    return null;
  }
}

export function localOrigin(request, port) {
  const host = request.headers.host ?? '';
  if (!/^(?:127\.0\.0\.1|localhost)(?::\d{1,5})?$/u.test(host)) return null;
  const parsed = new URL(`http://${host}`);
  if (Number(parsed.port || 80) !== port) return null;
  return parsed.origin;
}

export function requireLocalOrigin(request, origin) {
  if (request.headers.origin !== origin) {
    throw new RequestPolicyError(403, 'invalid_origin', 'Use the local app to make this request.');
  }
}

export function requireImageHeaders(request, maxBytes) {
  const contentType = request.headers['content-type'];
  if (!['image/png', 'image/jpeg'].includes(contentType)) {
    throw new RequestPolicyError(415, 'unsupported_image', 'Choose a JPEG or PNG image.');
  }
  const length = request.headers['content-length'];
  if (length !== undefined && (!/^\d+$/u.test(length) || Number(length) > maxBytes)) {
    throw new RequestPolicyError(413, 'image_too_large', 'The image exceeds the app upload limit.');
  }
  if (request.headers['content-encoding']) {
    throw new RequestPolicyError(415, 'unsupported_encoding', 'Send an uncompressed JPEG or PNG file.');
  }
  return contentType;
}

export function readImage(request, maxBytes, contentType) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const cleanup = () => {
      request.off('data', onData);
      request.off('end', onEnd);
      request.off('aborted', onAbort);
      request.off('error', onAbort);
    };
    const fail = (error) => {
      cleanup();
      request.pause();
      for (const chunk of chunks) chunk.fill(0);
      reject(error);
    };
    const onData = (chunk) => {
      size += chunk.length;
      if (size > maxBytes) fail(new RequestPolicyError(413, 'image_too_large', 'The image exceeds the app upload limit.'));
      else chunks.push(chunk);
    };
    const onAbort = () => fail(new RequestPolicyError(400, 'interrupted_upload', 'The local upload was interrupted.'));
    const onEnd = () => {
      cleanup();
      const image = Buffer.concat(chunks);
      for (const chunk of chunks) chunk.fill(0);
      const png = image.length >= 8 && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpeg = image.length >= 3 && image[0] === 255 && image[1] === 216 && image[2] === 255;
      if ((contentType === 'image/png' && png) || (contentType === 'image/jpeg' && jpeg)) resolve(image);
      else {
        image.fill(0);
        reject(new RequestPolicyError(415, 'invalid_image_signature', 'The file does not match a supported image format.'));
      }
    };
    request.on('data', onData);
    request.once('end', onEnd);
    request.once('aborted', onAbort);
    request.once('error', onAbort);
  });
}

const providerMessages = Object.freeze({
  provider_auth: 'YouCam did not accept the configured access.',
  provider_rate_limit: 'YouCam is rate-limiting requests. No new analysis was started automatically.',
  provider_conflict: 'YouCam could not start this request. No automatic retry was made.',
  provider_request_rejected: 'YouCam rejected the supplied analysis input.',
  provider_unavailable: 'YouCam is unavailable. No automatic analysis retry was made.',
  provider_response_invalid: 'YouCam returned an unsupported response.',
  provider_timeout: 'The provider response timed out. Check the same analysis before starting another.',
  network_error: 'The provider could not be reached. No automatic analysis retry was made.',
  creation_uncertain: 'The analysis outcome is unknown. No new analysis will be started automatically.',
  analysis_failed: 'YouCam could not complete the analysis.',
  aborted: 'Local work stopped. This does not confirm provider cancellation or deletion.',
});

export function safeProviderError(error, uncertain = false) {
  const code = Object.hasOwn(providerMessages, error?.code) ? error.code : 'provider_unavailable';
  return {
    code,
    message: uncertain
      ? 'The provider outcome is uncertain. Check this same analysis if available; no new task was started automatically.'
      : providerMessages[code],
  };
}

export function normalizeTextureResult(result) {
  if (result?.type !== 'texture') return null;
  for (const value of [result.uiScore, result.rawScore]) {
    if (!Number.isFinite(value) || value < 1 || value > 100) return null;
  }
  return { type: 'texture', uiScore: result.uiScore, rawScore: result.rawScore, source: 'YouCam', simulated: false };
}
