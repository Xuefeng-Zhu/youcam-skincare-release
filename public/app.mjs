import { checkLabel } from './label-check.mjs';
import { initializeConsultation } from './consultation-ui.mjs';

const form = document.querySelector('#label-form');
const choices = document.querySelector('#product-options');
const sensitivities = document.querySelector('#sensitivities');
const result = document.querySelector('#check-result');
const checkButton = document.querySelector('#check-button');
const ingredientList = document.querySelector('#ingredient-list');
const sourceStrip = document.querySelector('#source-strip');
const sourceLink = document.querySelector('#label-source');
const sourceMeta = document.querySelector('#source-meta');
let catalog = [];
let selectedId = null;
let hasChecked = false;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function clearResult(message = 'Choose a product, then check its label. Leave sensitivities blank to explore the documented ingredients only.') {
  hasChecked = false;
  result.className = 'check-result result--empty';
  result.replaceChildren(element('p', 'What this check can tell you', 'result-eyebrow'), element('p', message, 'empty-result'));
}

function currentProduct() {
  return catalog.find((product) => product.id === selectedId);
}

function selectProduct(id) {
  selectedId = id;
  const product = currentProduct();
  for (const option of choices.querySelectorAll('.product-option')) {
    const input = option.querySelector('input');
    input.checked = input.value === id;
    option.classList.toggle('is-selected', input.checked);
  }
  ingredientList.replaceChildren(...product.ingredients.map((name) => element('li', name)));
  document.querySelector('#ingredient-summary').textContent = `View verified web label · ${product.ingredients.length} ingredients`;
  const source = new URL(product.sourceUrl);
  if (source.protocol !== 'https:') throw new Error('Unsupported source');
  sourceLink.href = source.href;
  sourceMeta.textContent = `United States · ${product.size} · Reviewed ${product.reviewedAt}`;
  sourceStrip.hidden = false;
  clearResult();
}

function renderOptions() {
  choices.replaceChildren();
  for (const product of catalog) {
    const option = element('label', undefined, 'product-option');
    const radio = element('input');
    radio.type = 'radio';
    radio.name = 'product';
    radio.value = product.id;
    const visual = element('span', undefined, 'radio-visual');
    visual.setAttribute('aria-hidden', 'true');
    const text = element('span', undefined, 'product-text');
    radio.setAttribute('aria-label', `${product.name}, ${product.variant}, ${product.size}`);
    const series = product.id === 'ultra-gentle' ? 'Ultra Gentle' : 'Hydro Boost';
    const type = product.id === 'ultra-gentle' ? 'Daily Facial Moisturizer' : 'Water Cream';
    text.append(element('span', product.brand, 'product-brand'), element('span', series, 'product-name'), element('span', type, 'product-type'), element('span', `${product.variant} · ${product.size}`, 'product-variant'));
    option.append(radio, visual, text, element('span', `${product.ingredients.length} documented ingredients`, 'product-count'));
    choices.append(option);
    radio.addEventListener('change', () => selectProduct(product.id));
  }
  selectProduct(catalog[0].id);
}

const resultCopy = {
  'label-only': { title: 'Label information only', description: 'No sensitivities supplied. These are label facts only.' },
  caution: { title: 'Caution: documented overlap', description: 'Matching ingredient found. This is a caution, not an allergy diagnosis.' },
  insufficient: { title: 'Insufficient information', description: 'An entry or label is unresolved. No suitability conclusion can be made.' },
  'no-overlap': { title: 'No documented overlap in this label', description: 'No supplied sensitivity was found. This does not establish tolerance or suitability.' },
};

function renderResult(checked) {
  const copy = resultCopy[checked.status] ?? resultCopy.insufficient;
  result.className = `check-result result--${checked.status}`;
  const nodes = [element('p', 'Label comparison', 'result-eyebrow'), element('h3', copy.title), element('p', copy.description)];
  if (checked.overlaps.length) {
    const list = element('ul', undefined, 'overlap-list');
    for (const overlap of checked.overlaps) list.append(element('li', `${overlap.input} → ${overlap.ingredient}`));
    nodes.push(list);
  }
  if (checked.unresolved.length) {
    nodes.push(element('p', 'Unresolved entries', 'uncertainty-heading'));
    const list = element('ul', undefined, 'unresolved-list');
    for (const name of checked.unresolved) list.append(element('li', name));
    nodes.push(list);
  }
  if (checked.reasons.length) {
    const explanation = element('details');
    explanation.append(element('summary', 'Why this result'));
    for (const reason of checked.reasons) explanation.append(element('p', reason));
    nodes.push(explanation);
  }
  if (checked.status !== 'label-only') nodes.push(element('p', 'A label cannot predict your skin’s response. Compare your actual package.', 'result-limit'));
  result.replaceChildren(...nodes);
  result.focus({ preventScroll: true });
  hasChecked = true;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (document.querySelector('#product-panel').hidden) return;
  renderResult(checkLabel(currentProduct(), sensitivities.value, catalog));
});

sensitivities.addEventListener('input', () => {
  if (hasChecked) clearResult('Your input changed. Check the label again to see an up-to-date result.');
});

function clearInputs() {
  sensitivities.value = '';
  clearResult();
}

document.querySelector('#clear-inputs').addEventListener('click', () => {
  clearInputs();
  document.querySelector('#clear-inputs').focus();
});
window.addEventListener('pagehide', clearInputs);
window.addEventListener('pageshow', (event) => {
  if (event.persisted) clearInputs();
});

async function initialize() {
  sensitivities.value = '';
  try {
    const response = await fetch('/catalog.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Catalog unavailable');
    const data = await response.json();
    if (!Array.isArray(data) || data.length !== 2 || data.some((product) => !product.id || !Array.isArray(product.ingredients) || !product.ingredients.length)) throw new Error('Catalog unavailable');
    catalog = data;
    renderOptions();
    checkButton.disabled = false;
  } catch {
    choices.replaceChildren(element('p', 'The reviewed catalog is unavailable. Reload to try again; no ingredients will be invented.', 'muted'));
    checkButton.disabled = true;
    result.className = 'check-result result--insufficient';
    result.replaceChildren(element('h3', 'Insufficient information'), element('p', 'A verified product label could not be loaded.'));
  }
}

initializeConsultation({ onReset: clearInputs, onInvalidate: () => clearResult('Your answers changed. Check the label again for a current result.') });
initialize();
