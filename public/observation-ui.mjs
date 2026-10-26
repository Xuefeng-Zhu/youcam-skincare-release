const CONSENT_VERSION = 'youcam-2026-10-26';
const MAX_IMAGE_BYTES = 8_000_000;
const MINIMUM_SHORT_SIDE = 480;
const POLL_INTERVAL_MS = 10_000;
const POLL_WINDOW_MS = 120_000;

function element(tag, text, className) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (className) item.className = className;
  return item;
}

function isResult(value, simulated) {
  return value?.type === 'texture' && value.simulated === simulated
    && value.source === (simulated ? 'Simulated fixture' : 'YouCam')
    && Number.isFinite(value.uiScore) && value.uiScore >= 0 && value.uiScore <= 100;
}

export function initializeObservationUI() {
  const panel = document.querySelector('#observation-panel');
  const modeLabel = document.querySelector('#observation-mode');
  const note = document.querySelector('#observation-note');
  const disabled = document.querySelector('#observation-disabled');
  const fixture = document.querySelector('#observation-fixture');
  const fixtureButton = document.querySelector('#observation-show-fixture');
  const form = document.querySelector('#observation-form');
  const fileInput = document.querySelector('#observation-file');
  const consent = document.querySelector('#observation-consent');
  const analyze = document.querySelector('#observation-analyze');
  const preview = document.querySelector('#observation-preview');
  const previewImage = document.querySelector('#observation-preview-image');
  const photoMeta = document.querySelector('#observation-photo-meta');
  const status = document.querySelector('#observation-status');
  const result = document.querySelector('#observation-result');
  const resume = document.querySelector('#observation-resume');
  const clear = document.querySelector('#observation-clear');
  let config = null;
  let eligible = false;
  let generation = 0;
  let selectedFile = null;
  let previewURL = null;
  let operationId = null;
  let busy = false;
  let submissionLocked = false;
  let canResume = false;
  let pollTimer = null;
  let requestController = null;
  let pollDeadline = 0;

  const current = (token) => token === generation && eligible;
  const liveReady = () => config?.mode === 'live' && config.configured === true;

  function controls() {
    form.hidden = !liveReady();
    fixture.hidden = config?.mode !== 'fixture';
    disabled.hidden = liveReady() || config?.mode === 'fixture';
    fileInput.disabled = busy || submissionLocked;
    consent.disabled = busy || submissionLocked;
    analyze.disabled = !eligible || !liveReady() || !selectedFile || !consent.checked || busy || submissionLocked;
    fixtureButton.disabled = !eligible || busy;
    resume.hidden = !canResume || !operationId;
    resume.disabled = busy;
    clear.hidden = !selectedFile && !operationId && !submissionLocked && result.hidden && !busy;
    panel.setAttribute('aria-busy', String(busy));
  }

  function setStatus(message) { status.textContent = message; }

  function forget(id) {
    if (!id) return;
    // This forgets the local reference; it does not cancel work at the provider.
    void fetch(`/api/analysis/${encodeURIComponent(id)}`, {
      method: 'DELETE', cache: 'no-store', credentials: 'same-origin', keepalive: true,
      redirect: 'error',
    }).catch(() => {});
  }

  function reset({ keepPicker = false, announce = false } = {}) {
    const wasSubmitted = submissionLocked || Boolean(operationId);
    const previousId = operationId;
    generation += 1;
    clearTimeout(pollTimer);
    pollTimer = null;
    requestController?.abort();
    requestController = null;
    operationId = null;
    busy = false;
    submissionLocked = false;
    canResume = false;
    selectedFile = null;
    if (!keepPicker) fileInput.value = '';
    consent.checked = false;
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = null;
    previewImage.removeAttribute('src');
    preview.hidden = true;
    photoMeta.textContent = '';
    result.replaceChildren();
    result.hidden = true;
    setStatus(announce ? (wasSubmitted
      ? 'Cleared here. Any processing already started at YouCam may continue; this does not delete provider data.'
      : 'Cleared. No photo has been sent.') : '');
    forget(previousId);
    controls();
  }

  function setEligibility(value) {
    const next = value === true;
    if (!next && eligible) reset();
    eligible = next;
    panel.hidden = !eligible;
    controls();
  }

  async function request(url, options, timeoutMs) {
    const controller = new AbortController();
    requestController = controller;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        cache: 'no-store', credentials: 'same-origin', redirect: 'error',
        ...options, signal: controller.signal,
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } finally {
      clearTimeout(timeout);
      if (requestController === controller) requestController = null;
    }
  }

  function pause(message, recoverable = true) {
    clearTimeout(pollTimer);
    pollTimer = null;
    busy = false;
    canResume = recoverable && Boolean(operationId);
    setStatus(message);
    controls();
  }

  function renderResult(value, simulated) {
    if (!isResult(value, simulated)) {
      pause('The observation response could not be verified. No score will be shown.', false);
      return;
    }
    busy = false;
    canResume = false;
    const items = [
      element('p', simulated ? 'SIMULATED FIXTURE · NOT YOUR SKIN' : 'YOUCAM · COSMETIC OBSERVATION', simulated ? 'fixture-label' : 'result-eyebrow'),
      element('h3', 'Texture cosmetic score'),
      element('p', String(value.uiScore), 'observation-score'),
      element('p', 'Presentation-adjusted cosmetic score. It is not confidence, a diagnosis, skin health, or product suitability.', 'observation-score-limit'),
    ];
    if (Number.isFinite(value.rawScore)) {
      const details = element('details');
      details.append(element('summary', 'Provider value'), element('p', `Raw cosmetic score: ${value.rawScore}. This is not a clinical measure.`));
      items.push(details);
    }
    result.replaceChildren(...items);
    result.hidden = false;
    setStatus(simulated ? 'Simulated result only. No photo was selected or sent.' : 'Observation received. It does not change your care guidance or label check.');
    if (!simulated) {
      modeLabel.textContent = 'Live · result received';
      note.textContent = 'YouCam cosmetic observation. This result is separate from care guidance and product labels.';
    }
    controls();
    result.focus();
  }

  function schedulePoll(token, requestedDelay) {
    if (!current(token) || !operationId) return;
    const remaining = pollDeadline - performance.now();
    const delay = Math.max(POLL_INTERVAL_MS, Number.isFinite(requestedDelay) ? requestedDelay : POLL_INTERVAL_MS);
    if (remaining <= delay) {
      pollTimer = setTimeout(() => {
        if (current(token)) pause('Waiting paused after two minutes. Check the existing analysis to recover its status; a new photo request will not be started.');
      }, Math.max(0, remaining));
    } else {
      pollTimer = setTimeout(() => poll(token), delay);
    }
  }

  async function poll(token) {
    if (!current(token) || !operationId) return;
    const remaining = pollDeadline - performance.now();
    if (remaining <= 0) {
      pause('Waiting paused after two minutes. You can check the existing analysis.');
      return;
    }
    try {
      const response = await request(`/api/analysis/${encodeURIComponent(operationId)}`, {}, Math.min(15_000, remaining));
      if (!current(token)) return;
      if (!response.ok) {
        pause(response.status === 404 || response.status === 410
          ? 'The local analysis reference is unavailable or expired. This does not establish provider deletion.'
          : 'Status could not be confirmed. Check the existing analysis before trying another.', response.status !== 404 && response.status !== 410);
        return;
      }
      const data = response.data;
      if (!current(token)) return;
      if (data.status === 'success') {
        renderResult(data.result, false);
      } else if (data.status === 'error') {
        pause('YouCam could not complete this analysis. Clear it before starting another; processing or credits may already have been used.', false);
      } else if (data.status === 'uncertain') {
        pause('The analysis outcome is uncertain. Check the existing analysis before starting another.');
      } else if (data.status === 'starting' || data.status === 'running') {
        const expires = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt)
          ? data.expiresAt : Date.parse(data.expiresAt);
        if (Number.isFinite(expires) && expires <= Date.now()) {
          pause('The local analysis reference has expired. This does not establish provider deletion.', false);
          return;
        }
        setStatus('YouCam is processing. You may clear this page to stop local waiting.');
        schedulePoll(token, data.pollAfterMs);
      } else {
        pause('The analysis status could not be verified. Check the existing analysis before trying another.');
      }
    } catch {
      if (current(token)) pause('Status could not be confirmed. Check the existing analysis before trying another.');
    }
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    reset({ keepPicker: true });
    if (!file || !eligible || !liveReady()) return;
    const token = generation;
    const byteLimit = Math.min(MAX_IMAGE_BYTES, config.maxImageBytes);
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setStatus('Choose a JPEG or PNG photo. No file has been sent.');
      return;
    }
    if (!file.size || file.size > byteLimit) {
      setStatus('Choose a non-empty photo up to 8 MB. No file has been sent.');
      return;
    }
    setStatus('Checking this photo locally…');
    const url = URL.createObjectURL(file);
    previewURL = url;
    const image = new Image();
    let decodeTimeout;
    let keepURL = false;
    try {
      const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      if (!current(token)) return;
      const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
      const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => header[index] === value);
      if (!((file.type === 'image/jpeg' && jpeg) || (file.type === 'image/png' && png))) {
        setStatus('This file is not a matching JPEG or PNG photo. No file has been sent.');
        return;
      }
      image.src = url;
      await Promise.race([
        image.decode(),
        new Promise((_, reject) => { decodeTimeout = setTimeout(() => reject(new Error('decode_timeout')), 10_000); }),
      ]);
      if (!current(token)) return;
      if (Math.min(image.naturalWidth, image.naturalHeight) < Math.max(MINIMUM_SHORT_SIDE, config.minimumShortSide)) {
        setStatus('Choose a photo at least 480 px on its shorter side. No file has been sent.');
        return;
      }
      selectedFile = file;
      previewURL = url;
      keepURL = true;
      previewImage.src = url;
      photoMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight} px · Local preview`;
      preview.hidden = false;
      setStatus('Photo ready locally. Review consent, then select Analyze to send it.');
    } catch {
      if (current(token)) setStatus('This photo could not be decoded. Choose another JPEG or PNG. No file has been sent.');
    } finally {
      clearTimeout(decodeTimeout);
      if (!keepURL) {
        URL.revokeObjectURL(url);
        if (previewURL === url) previewURL = null;
      }
      if (current(token)) controls();
    }
  });

  consent.addEventListener('change', controls);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!eligible || !liveReady() || !selectedFile || !consent.checked || busy || submissionLocked) return;
    const token = generation;
    busy = true;
    submissionLocked = true;
    canResume = false;
    setStatus('Sending your consented photo to YouCam…');
    controls();
    try {
      const response = await request('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': selectedFile.type, 'X-YouCam-Consent': CONSENT_VERSION },
        body: selectedFile,
      }, 30_000);
      if (!current(token)) return;
      if (response.status !== 202) {
        pause(response.status === 413 ? 'This photo exceeds the server image limit. No new request will be started automatically.'
          : 'The request was not confirmed. Processing or credits may already have been used. Clear before deliberately starting another.', false);
        return;
      }
      const data = response.data;
      if (!current(token)) return;
      if (typeof data.operationId !== 'string' || !/^[a-zA-Z0-9_-]{1,200}$/u.test(data.operationId)) {
        pause('The analysis reference could not be verified. Processing may have started; no request will be repeated automatically.', false);
        return;
      }
      operationId = data.operationId;
      pollDeadline = performance.now() + Math.min(POLL_WINDOW_MS, config.pollWindowMs);
      setStatus('YouCam is processing. Checking status about every 10 seconds.');
      controls();
      schedulePoll(token, data.pollAfterMs);
    } catch {
      if (current(token)) pause('The request outcome is uncertain. Processing may have started; no request will be repeated automatically.', false);
    }
  });

  resume.addEventListener('click', () => {
    if (!eligible || !operationId || busy || !canResume) return;
    busy = true;
    canResume = false;
    pollDeadline = performance.now() + Math.min(POLL_WINDOW_MS, config.pollWindowMs);
    setStatus('Checking the existing analysis. No new photo is being sent.');
    controls();
    void poll(generation);
  });

  fixtureButton.addEventListener('click', async () => {
    if (!eligible || config?.mode !== 'fixture' || busy) return;
    const token = generation;
    busy = true;
    controls();
    setStatus('Loading a simulated fixture. No photo is used.');
    try {
      const response = await request('/api/fixture-observation', {}, 10_000);
      if (!current(token)) return;
      const data = response.ok ? response.data : null;
      if (!current(token)) return;
      if (data?.mode !== 'fixture' || data.simulated !== true || !isResult(data.result, true)) {
        pause('The simulated fixture is unavailable. No live analysis was requested.', false);
        return;
      }
      renderResult(data.result, true);
    } catch {
      if (current(token)) pause('The simulated fixture is unavailable. No live analysis was requested.', false);
    }
  });

  clear.addEventListener('click', () => {
    reset({ announce: true });
    document.querySelector('#observation-details > summary').focus();
  });

  async function loadConfig() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch('/api/config', { cache: 'no-store', credentials: 'same-origin', redirect: 'error', signal: controller.signal });
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      if (!['disabled', 'fixture', 'live'].includes(data?.mode)) throw new Error('unavailable');
      if (data.mode === 'live' && data.configured === true && (
        data.consentVersion !== CONSENT_VERSION || !Number.isFinite(data.maxImageBytes) || data.maxImageBytes <= 0
        || !Number.isFinite(data.minimumShortSide) || data.minimumShortSide < MINIMUM_SHORT_SIDE
        || !Number.isFinite(data.pollWindowMs) || data.pollWindowMs <= 0
      )) throw new Error('unavailable');
      config = data;
      if (data.mode === 'fixture') {
        modeLabel.textContent = 'Simulated fixture';
        note.textContent = 'A simulated texture example. No photo picker, upload, or live YouCam analysis.';
      } else if (liveReady()) {
        modeLabel.textContent = 'Live · key configured';
        note.textContent = 'The key is configured; the connection is not yet verified. This optional cosmetic observation is separate from care guidance and product labels.';
      } else if (data.mode === 'disabled') {
        modeLabel.textContent = 'Disabled';
        note.textContent = 'Observation is disabled on this local server. No photo can be selected or sent.';
      } else {
        modeLabel.textContent = 'Unavailable';
        note.textContent = 'Live observation is not configured. No photo can be selected or sent.';
      }
    } catch {
      config = { mode: 'disabled', configured: false };
      modeLabel.textContent = 'Unavailable';
      note.textContent = 'Observation availability could not be checked. No photo can be selected or sent.';
    } finally {
      clearTimeout(timeout);
      controls();
    }
  }

  controls();
  void loadConfig();
  return { setEligibility, reset };
}
