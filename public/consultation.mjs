/**
 * Routes a short, self-reported consultation. It does not diagnose, establish
 * product tolerance, or interpret a cosmetic score. No data is stored or sent.
 */
const CARE_KEYS = ['emergency', 'rash', 'persistentOrReactive'];
const GENERAL_EDUCATION = ['gentle-cleansing', 'warm-washing', 'moisturize-damp'];

// Preserve an explicit warning even when a malformed field contains conflicting
// array answers. Arrays containing only "no" are still invalid, not explicit no.
function containsYes(value) {
  const pending = [value];
  const visited = new WeakSet();
  while (pending.length) {
    const current = pending.pop();
    if (current === 'yes') return true;
    if (Array.isArray(current) && !visited.has(current)) {
      visited.add(current);
      for (const answer of current) pending.push(answer);
    }
  }
  return false;
}

function result(route, reasons) {
  const supported = route === 'supported';
  return {
    route,
    reasons,
    canScan: supported,
    canConsiderProducts: supported,
    educationIds: route === 'emergency' || route === 'care-review' ? [] : [...GENERAL_EDUCATION],
  };
}

/**
 * @param {object} input Self-reported concern, context, routine, and care answers.
 * @returns {{route:string, reasons:string[], canScan:boolean, canConsiderProducts:boolean, educationIds:string[]}}
 */
export function evaluateConsultation(input) {
  const care = input?.care;
  if (containsYes(care?.emergency)) return result('emergency', ['emergency']);

  const warningReasons = [];
  if (containsYes(care?.rash)) warningReasons.push('rash');
  if (containsYes(care?.persistentOrReactive)) warningReasons.push('persistent-reactive');
  if (warningReasons.length) return result('care-review', warningReasons);

  if (!care || typeof care !== 'object' || Array.isArray(care)
    || CARE_KEYS.some((key) => care[key] !== 'no')) {
    return result('unknown', ['missing-care']);
  }

  if (input?.concern !== 'dry-feeling') {
    return result('unsupported', ['unsupported-concern']);
  }

  return result('supported', []);
}
