import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateConsultation } from '../public/consultation.mjs';

const education = ['gentle-cleansing', 'warm-washing', 'moisturize-damp'];
const careKeys = ['emergency', 'rash', 'persistentOrReactive'];

function intake(changes = {}) {
  return {
    concern: 'dry-feeling',
    duration: 'A few days',
    recentChange: 'no',
    cleanser: 'Provided cleanser context',
    moisturizer: 'Provided moisturizer context',
    care: { emergency: 'no', rash: 'no', persistentOrReactive: 'no' },
    ...changes,
  };
}

function withCare(changes) {
  const input = intake();
  return { ...input, care: { ...input.care, ...changes } };
}

function assertUnavailable(result) {
  assert.equal(result.canScan, false);
  assert.equal(result.canConsiderProducts, false);
  assert.ok(!Object.hasOwn(result, 'safe'));
  assert.ok(!Object.hasOwn(result, 'cleared'));
}

test('dry-feeling track with three explicit no answers supports the optional next steps', () => {
  assert.deepEqual(evaluateConsultation(intake()), {
    route: 'supported',
    reasons: [],
    canScan: true,
    canConsiderProducts: true,
    educationIds: education,
  });
});

test('emergency yes has highest precedence over concern, other warnings, and missing answers', () => {
  const result = evaluateConsultation(intake({
    concern: 'other',
    care: { emergency: 'yes', rash: 'yes', persistentOrReactive: 'unsure' },
  }));
  assert.equal(result.route, 'emergency');
  assert.deepEqual(result.reasons, ['emergency']);
  assert.deepEqual(result.educationIds, []);
  assertUnavailable(result);
});

test('rash yes routes to care review instead of unknown or unsupported', () => {
  const result = evaluateConsultation(intake({
    concern: 'other',
    care: { emergency: 'unsure', rash: 'yes', persistentOrReactive: '' },
  }));
  assert.equal(result.route, 'care-review');
  assert.deepEqual(result.reasons, ['rash']);
  assert.deepEqual(result.educationIds, []);
  assertUnavailable(result);
});

test('persistent or reactive concern routes to care review', () => {
  const result = evaluateConsultation(withCare({ persistentOrReactive: 'yes' }));
  assert.equal(result.route, 'care-review');
  assert.deepEqual(result.reasons, ['persistent-reactive']);
  assert.deepEqual(result.educationIds, []);
  assertUnavailable(result);
});

test('multiple care-review warnings preserve both stable reason IDs', () => {
  const result = evaluateConsultation(withCare({ rash: 'yes', persistentOrReactive: 'yes' }));
  assert.equal(result.route, 'care-review');
  assert.deepEqual(result.reasons, ['rash', 'persistent-reactive']);
  assert.deepEqual(result.educationIds, []);
  assertUnavailable(result);
});

test('each missing, uncertain, declined, or invalid care answer stays unknown', () => {
  const unknowns = ['', 'unsure', 'declined', undefined, null, true, false, 0, 'invalid', 'NO', ' no ', {}, []];
  for (const key of careKeys) {
    for (const answer of unknowns) {
      const result = evaluateConsultation(withCare({ [key]: answer }));
      assert.equal(result.route, 'unknown', `${key}: ${String(answer)}`);
      assert.deepEqual(result.reasons, ['missing-care']);
      assert.deepEqual(result.educationIds, education);
      assertUnavailable(result);
    }
  }
});

test('absent or malformed intake and care objects do not default to no', () => {
  for (const input of [undefined, null, {}, [], true, 'dry-feeling', intake({ care: null }), intake({ care: [] })]) {
    const result = evaluateConsultation(input);
    assert.equal(result.route, 'unknown');
    assert.deepEqual(result.reasons, ['missing-care']);
    assertUnavailable(result);
  }
});

test('other, blank, and malformed concerns are unsupported after explicit care answers', () => {
  for (const concern of ['other', '', undefined, null, 'acne', 'Dry-feeling', ['dry-feeling']]) {
    const result = evaluateConsultation(intake({ concern }));
    assert.equal(result.route, 'unsupported');
    assert.deepEqual(result.reasons, ['unsupported-concern']);
    assert.deepEqual(result.educationIds, education);
    assertUnavailable(result);
  }
});

test('unknown care takes precedence over out-of-track concern', () => {
  const result = evaluateConsultation(intake({ concern: 'other', care: { emergency: 'no', rash: 'declined', persistentOrReactive: 'no' } }));
  assert.equal(result.route, 'unknown');
  assert.deepEqual(result.reasons, ['missing-care']);
  assertUnavailable(result);
});

test('contradictory malformed emergency arrays preserve any explicit yes', () => {
  for (const emergency of [['no', 'yes'], ['yes', 'no'], ['declined', ['no', 'yes']]]) {
    const result = evaluateConsultation(withCare({ emergency }));
    assert.equal(result.route, 'emergency');
    assert.deepEqual(result.reasons, ['emergency']);
    assert.deepEqual(result.educationIds, []);
    assertUnavailable(result);
  }
});

test('malformed warning arrays also preserve explicit yes while no-only arrays remain unknown', () => {
  for (const key of ['rash', 'persistentOrReactive']) {
    const result = evaluateConsultation(withCare({ [key]: ['no', 'yes'] }));
    assert.equal(result.route, 'care-review');
    assert.deepEqual(result.reasons, [key === 'rash' ? 'rash' : 'persistent-reactive']);
    assert.deepEqual(result.educationIds, []);
    assertUnavailable(result);
  }
  for (const key of careKeys) {
    assert.equal(evaluateConsultation(withCare({ [key]: ['no', 'no'] })).route, 'unknown');
  }
});

test('cyclic malformed arrays terminate and retain a reachable yes', () => {
  const unknownCycle = [];
  unknownCycle.push(unknownCycle, 'no');
  assert.equal(evaluateConsultation(withCare({ emergency: unknownCycle })).route, 'unknown');
  const warningCycle = [];
  warningCycle.push(warningCycle, 'no', ['yes']);
  assert.equal(evaluateConsultation(withCare({ emergency: warningCycle })).route, 'emergency');
});

test('cosmetic scores and commercial fields cannot alter routing or override warnings', () => {
  const baseline = intake();
  const commercial = { ui_score: 100, raw_score: 100, commission: 999, sponsored: true, price: 0 };
  assert.deepEqual(evaluateConsultation({ ...baseline, ...commercial }), evaluateConsultation(baseline));
  const warning = withCare({ emergency: 'yes' });
  assert.deepEqual(evaluateConsultation({ ...warning, ...commercial }), evaluateConsultation(warning));
  const unknown = withCare({ rash: 'unsure' });
  assert.deepEqual(evaluateConsultation({ ...unknown, ...commercial }), evaluateConsultation(unknown));
});

test('duration, recent changes and routine context do not invent a clinical conclusion', () => {
  const baseline = evaluateConsultation(intake());
  assert.deepEqual(evaluateConsultation(intake({ duration: '', recentChange: 'yes', cleanser: '', moisturizer: '' })), baseline);
  assert.deepEqual(evaluateConsultation(intake({ duration: 'longer', recentChange: 'unsure', cleanser: { unknown: true }, moisturizer: null })), baseline);
});

test('repeated calls are stateless and neither mutate inputs nor reuse output arrays', () => {
  const input = intake();
  const before = structuredClone(input);
  const first = evaluateConsultation(input);
  evaluateConsultation(withCare({ rash: 'yes' }));
  assert.deepEqual(evaluateConsultation(input), first);
  first.reasons.push('changed');
  first.educationIds[0] = 'changed';
  assert.deepEqual(evaluateConsultation(input), {
    route: 'supported', reasons: [], canScan: true, canConsiderProducts: true, educationIds: education,
  });
  assert.deepEqual(input, before);
});
