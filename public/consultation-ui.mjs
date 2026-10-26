import { evaluateConsultation } from './consultation.mjs';
import { initializeObservationUI } from './observation-ui.mjs';

const educationIds = ['gentle-cleansing', 'warm-washing', 'moisturize-damp'];

function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (className) item.className = className;
  return item;
}

function validContent(data) {
  if (!data?.version || !data.reviewedAt || !Array.isArray(data.sources) || !Array.isArray(data.education)) return false;
  const sourceIds = new Set();
  for (const source of data.sources) {
    if (!source?.id || !source.title || sourceIds.has(source.id)) return false;
    try { if (new URL(source.url).protocol !== 'https:') return false; } catch { return false; }
    sourceIds.add(source.id);
  }
  const content = [...data.education, ...Object.values(data.care ?? {})];
  if (!['emergency', 'review', 'unknown', 'unsupported'].every((key) => data.care?.[key])) return false;
  if (!educationIds.every((id) => data.education.some((item) => item.id === id))) return false;
  return content.every((item) => item?.title && item.body && Array.isArray(item.sourceIds)
    && item.sourceIds.length && item.sourceIds.every((id) => sourceIds.has(id)));
}

export function initializeConsultation({ onReset, onInvalidate }) {
  const observation = initializeObservationUI();
  const contextForm = document.querySelector('#context-form');
  const careForm = document.querySelector('#care-form');
  const productPanel = document.querySelector('#product-panel');
  const summaryTitle = document.querySelector('#summary-title');
  const outcome = document.querySelector('#care-outcome');
  const educationSection = document.querySelector('#education-section');
  const questions = {
    context: [...document.querySelectorAll('[data-context-question]')],
    care: [...document.querySelectorAll('[data-care-question]')],
  };
  const questionIndex = { context: 0, care: 0 };
  let guidance = null;

  function showStage(stage, focus = true) {
    for (const section of document.querySelectorAll('[data-stage]')) section.hidden = section.dataset.stage !== stage;
    for (const item of document.querySelectorAll('[data-progress]')) {
      if (item.dataset.progress === stage) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    }
    if (focus) document.querySelector(`[data-stage="${stage}"] .stage-title`).focus();
  }

  function showQuestion(stage, index, focus = true) {
    questionIndex[stage] = index;
    questions[stage].forEach((question, position) => { question.hidden = position !== index; });
    document.querySelector(`#${stage}-title`).textContent = questions[stage][index].dataset.questionTitle;
    document.querySelector(`#${stage}-counter`).textContent = `${index + 1} of ${questions[stage].length}`;
    const next = document.querySelector(`#${stage}-next`);
    next.replaceChildren(node('span', stage === 'care' && index === questions.care.length - 1 ? 'See my next step' : 'Continue'), node('span', '→'));
    next.lastChild.setAttribute('aria-hidden', 'true');
    if (stage === 'context') document.querySelector('#context-back').hidden = index === 0;
    showStage(stage, focus);
  }

  function sources(ids) {
    const links = node('div', undefined, 'content-sources');
    for (const id of ids) {
      const source = guidance.sources.find((entry) => entry.id === id);
      const link = node('a', `${source.title} ↗`);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      links.append(link);
    }
    return links;
  }

  function sourceDisclosure(ids) {
    const details = node('details', undefined, 'source-disclosure');
    details.append(node('summary', 'Sources'), sources(ids));
    return details;
  }

  function currentInput() {
    const context = new FormData(contextForm);
    const care = new FormData(careForm);
    return {
      concern: context.get('concern'), duration: context.get('duration'),
      recentChange: context.get('recentChange'), cleanser: context.get('cleanser'),
      moisturizer: context.get('moisturizer'),
      care: Object.fromEntries(['emergency', 'rash', 'persistentOrReactive'].map((key) => [key, care.get(key)])),
    };
  }

  function renderGuide() {
    const input = currentInput();
    const checked = evaluateConsultation(input);
    observation.setEligibility(checked.canScan);
    outcome.dataset.route = checked.route;
    summaryTitle.textContent = checked.route === 'supported' ? 'Keep it simple.' : 'Care comes first.';
    const careKey = checked.route === 'care-review' ? 'review' : checked.route;
    const copy = guidance?.care[careKey];
    if (copy) {
      outcome.replaceChildren(node('h3', copy.title), node('p', copy.body), sourceDisclosure(copy.sourceIds));
    } else if (checked.route === 'supported') {
      outcome.replaceChildren(node('p', 'Start with gentle care. Your answers do not provide medical clearance.'));
    } else {
      outcome.replaceChildren(node('h3', checked.route === 'emergency' ? 'Get emergency help now' : 'Further information or professional advice is needed'),
        node('p', checked.route === 'emergency' ? 'Use your local emergency number now — 911 in the United States. Do not wait for a photo or a product check.' : 'A cosmetic scan cannot resolve a medical concern or uncertain warning-sign answers. Scan and product suggestions are paused.'));
    }

    const duration = { recent: 'A few days', weeks: 'A few weeks', months: 'Longer than a month', unsure: 'Duration uncertain' }[input.duration] ?? 'Duration not supplied';
    const routine = (value) => ({ yes: 'yes', no: 'no', unsure: 'not sure' }[value] ?? 'not supplied');
    document.querySelector('#reported-context').textContent = `${input.concern === 'dry-feeling' ? 'Dry-feeling skin' : 'Another concern'} · ${duration}. Cleanser: ${routine(input.cleanser)}. Moisturizer: ${routine(input.moisturizer)}. Recent changes: ${routine(input.recentChange)}.`;
    educationSection.hidden = checked.route === 'emergency' || checked.route === 'care-review';
    const educationList = document.querySelector('#education-list');
    if (guidance) {
      educationList.replaceChildren(...checked.educationIds.map((id, index) => {
        const content = guidance.education.find((entry) => entry.id === id);
        const item = node('article', undefined, 'education-item');
        const heading = node('div', undefined, 'education-heading');
        heading.append(node('span', String(index + 1).padStart(2, '0'), 'education-number'), node('h3', content.title));
        const detail = node('details', undefined, 'education-detail');
        detail.append(node('summary', 'Why & sources'), node('p', content.body), sources(content.sourceIds));
        item.append(heading, detail);
        return item;
      }));
    } else {
      educationList.replaceChildren(node('p', 'Reviewed guidance could not be loaded. No advice will be invented; reload to try again or use the source links below.'));
    }
    productPanel.hidden = !checked.canConsiderProducts;
    document.querySelector('.professional-note').hidden = checked.route === 'emergency';
    showStage('summary');
  }

  function invalidate() {
    observation.setEligibility(false);
    productPanel.hidden = true;
    onInvalidate();
  }

  function reset(focus = true) {
    observation.setEligibility(false);
    contextForm.reset();
    careForm.reset();
    onReset();
    outcome.replaceChildren();
    outcome.removeAttribute('data-route');
    document.querySelector('#reported-context').textContent = '';
    document.querySelector('#education-list').replaceChildren();
    productPanel.hidden = true;
    for (const detail of document.querySelectorAll('details')) detail.open = false;
    questionIndex.care = 0;
    showQuestion('context', 0, focus);
  }

  contextForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (questionIndex.context < questions.context.length - 1) showQuestion('context', questionIndex.context + 1);
    else showQuestion('care', 0);
  });
  careForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (questionIndex.care < questions.care.length - 1) showQuestion('care', questionIndex.care + 1);
    else renderGuide();
  });
  document.querySelector('#context-back').addEventListener('click', () => showQuestion('context', Math.max(0, questionIndex.context - 1)));
  document.querySelector('#care-back').addEventListener('click', () => {
    if (questionIndex.care > 0) showQuestion('care', questionIndex.care - 1);
    else showQuestion('context', questions.context.length - 1);
  });
  contextForm.addEventListener('input', invalidate);
  careForm.addEventListener('input', () => {
    invalidate();
    if (evaluateConsultation(currentInput()).route === 'emergency') renderGuide();
  });
  for (const button of document.querySelectorAll('[data-action]')) {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'reset') reset();
      else {
        invalidate();
        showQuestion(action === 'edit-care' ? 'care' : 'context', 0);
      }
    });
  }
  window.addEventListener('pagehide', () => reset(false));
  window.addEventListener('pageshow', (event) => { if (event.persisted) reset(false); });
  reset(false);

  fetch('/guidance.json', { cache: 'no-store' }).then(async (response) => {
    if (!response.ok) throw new Error('Guidance unavailable');
    const data = await response.json();
    if (!validContent(data)) throw new Error('Guidance unavailable');
    guidance = data;
    if (!document.querySelector('[data-stage="summary"]').hidden) renderGuide();
  }).catch(() => { guidance = null; });
}
