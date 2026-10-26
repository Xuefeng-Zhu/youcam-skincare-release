/**
 * A literal check of a reviewed web-label snapshot, not a suitability model.
 * No image score, price, sponsorship, storage, or network access belongs here.
 */
const normalize = (value) => value.trim().replace(/\s+/gu, ' ').toLowerCase();
const display = (value) => value.trim().replace(/\s+/gu, ' ');
const isText = (value) => typeof value === 'string' && value.trim().length > 0;

function isSourceUrl(value) {
  try {
    return typeof value === 'string' && new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function hasSourceIdentity(product) {
  return product && ['id', 'name', 'brand', 'market', 'size', 'variant'].every(
    (key) => isText(product[key]),
  ) && isSourceUrl(product.sourceUrl)
    && /^\d{4}-\d{2}-\d{2}$/u.test(product.reviewedAt ?? '');
}

function ingredientNames(product) {
  return Array.isArray(product?.ingredients) ? product.ingredients.filter(isText) : [];
}

function matchesIdentity(product, reviewed) {
  return ['id', 'name', 'brand', 'market', 'size', 'variant', 'sourceUrl', 'reviewedAt']
    .every((key) => product[key] === reviewed[key]);
}

function addMapping(vocabulary, input, ingredient) {
  const key = normalize(input);
  if (!vocabulary.has(key)) vocabulary.set(key, new Set());
  vocabulary.get(key).add(normalize(ingredient));
}

function reviewedVocabulary(catalog) {
  const vocabulary = new Map();
  for (const product of catalog) {
    if (!hasSourceIdentity(product)) continue;
    const names = ingredientNames(product);
    const exact = new Set(names.map(normalize));
    for (const ingredient of names) addMapping(vocabulary, ingredient, ingredient);
    for (const alias of Array.isArray(product.aliases) ? product.aliases : []) {
      if (isText(alias?.alias) && isText(alias?.ingredient)
        && exact.has(normalize(alias.ingredient)) && isSourceUrl(alias.sourceUrl)
        && /^\d{4}-\d{2}-\d{2}$/u.test(alias.reviewedAt ?? '')) {
        addMapping(vocabulary, alias.alias, alias.ingredient);
      }
    }
  }
  return vocabulary;
}

/**
 * @param {object|null} product Selected product record from the reviewed catalog.
 * @param {string} input Voluntarily supplied known sensitivities, one per line.
 * @param {object[]} catalog Reviewed records; their union defines known names.
 * @returns {{status:string, overlaps:object[], unresolved:string[], inputs:string[], reasons:string[]}}
 */
export function checkLabel(product, input = '', catalog = []) {
  const result = { status: 'insufficient', overlaps: [], unresolved: [], inputs: [], reasons: [] };
  if (typeof input !== 'string') {
    result.reasons.push('Known sensitivities must be entered as text.');
    return result;
  }

  const seen = new Set();
  for (const line of input.split(/\r?\n/u)) {
    const name = display(line);
    const key = normalize(name);
    if (name && !seen.has(key)) {
      seen.add(key);
      result.inputs.push(name);
    }
  }

  if (!Array.isArray(catalog) || catalog.length === 0) {
    result.reasons.push('The reviewed catalog is unavailable.');
    return result;
  }

  const records = catalog.filter((record) => record?.id === product?.id);
  const reviewed = records.length === 1 ? records[0] : null;
  if (!product || !hasSourceIdentity(product) || !hasSourceIdentity(reviewed)
    || !matchesIdentity(product, reviewed)) {
    result.reasons.push('The selected product does not match a reviewed market, variant, and source record.');
    return result;
  }

  const reviewedNames = ingredientNames(reviewed);
  const reviewedKeys = new Set(reviewedNames.map(normalize));
  const selectedNames = ingredientNames(product);
  const selectedKeys = new Set(selectedNames.map(normalize));
  const validLabel = Array.isArray(product.ingredients)
    && product.ingredients.length > 0
    && product.ingredients.every(isText);
  if (!validLabel) result.reasons.push('The selected ingredient list is missing or malformed.');
  if (product.labelComplete !== true || reviewed.labelComplete !== true) {
    result.reasons.push('The reviewed ingredient information is marked incomplete.');
  }
  if (selectedKeys.size !== reviewedKeys.size
    || [...selectedKeys].some((key) => !reviewedKeys.has(key))) {
    result.reasons.push('The selected ingredient list differs from the reviewed source snapshot.');
  }

  const selected = new Map(selectedNames
    .filter((name) => reviewedKeys.has(normalize(name)))
    .map((name) => [normalize(name), name]));
  const vocabulary = reviewedVocabulary(catalog);
  for (const name of result.inputs) {
    const meanings = vocabulary.get(normalize(name));
    if (!meanings || meanings.size !== 1) {
      result.unresolved.push(name);
      continue;
    }
    const [meaning] = meanings;
    if (selected.has(meaning)) {
      result.overlaps.push({ input: name, ingredient: selected.get(meaning) });
    }
  }
  if (result.unresolved.length) {
    result.reasons.push('Some entered names are not resolved by the reviewed ingredient names or sourced aliases.');
  }

  if (result.overlaps.length) result.status = 'caution';
  else if (result.reasons.length) result.status = 'insufficient';
  else if (result.inputs.length === 0) result.status = 'label-only';
  else result.status = 'no-overlap';
  return result;
}
