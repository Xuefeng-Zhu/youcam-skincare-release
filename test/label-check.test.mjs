import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { checkLabel } from '../public/label-check.mjs';

const catalog = JSON.parse(await readFile(new URL('../public/catalog.json', import.meta.url), 'utf8'));
const [gentle, hydro] = catalog;

test('catalog freezes two exact U.S. variants with source dates and complete displayed labels', () => {
  assert.equal(catalog.length, 2);
  assert.equal(gentle.id, 'ultra-gentle');
  assert.equal(hydro.id, 'hydro-boost-water-cream');
  assert.equal(gentle.ingredients.length, 22);
  assert.equal(hydro.ingredients.length, 39);
  for (const product of catalog) {
    assert.equal(product.market, 'United States');
    assert.equal(product.reviewedAt, '2026-10-26');
    assert.match(product.sourceUrl, /^https:\/\/www\.neutrogena\.com\/products\//u);
    assert.equal(product.labelComplete, true);
    assert.deepEqual(product.aliases, []);
    assert.ok(product.limitations.some((text) => text.includes('unverified')));
    assert.equal(new Set(product.ingredients.map((name) => name.toLowerCase())).size, product.ingredients.length);
  }
  assert.equal(gentle.size, '3.4 fl oz');
  assert.equal(hydro.size, '1.7 fl oz');
});

test('documented overlap produces a caution with the exact matching label name', () => {
  const result = checkLabel(gentle, 'Glycerin', catalog);
  assert.equal(result.status, 'caution');
  assert.deepEqual(result.overlaps, [{ input: 'Glycerin', ingredient: 'Glycerin' }]);
  assert.deepEqual(result.unresolved, []);
  assert.deepEqual(result.reasons, []);
});

test('matching only normalizes case and whitespace and deduplicates repeated entries', () => {
  const result = checkLabel(gentle, '  GLYCERIN  \r\nglycerin\n  Sodium   Hydroxide \n', catalog);
  assert.equal(result.status, 'caution');
  assert.deepEqual(result.inputs, ['GLYCERIN', 'Sodium Hydroxide']);
  assert.deepEqual(result.overlaps.map((overlap) => overlap.ingredient), ['Glycerin', 'Sodium Hydroxide']);
});

test('unknown name yields insufficient information rather than a positive suitability verdict', () => {
  const result = checkLabel(hydro, 'Unreviewed ingredient name', catalog);
  assert.equal(result.status, 'insufficient');
  assert.deepEqual(result.unresolved, ['Unreviewed ingredient name']);
  assert.deepEqual(result.overlaps, []);
  assert.ok(result.reasons.length > 0);
});

test('reviewed term absent from selected complete label yields qualified no-overlap status', () => {
  const result = checkLabel(hydro, 'Niacinamide', catalog);
  assert.equal(result.status, 'no-overlap');
  assert.deepEqual(result.inputs, ['Niacinamide']);
  assert.deepEqual(result.overlaps, []);
  assert.deepEqual(result.reasons, []);
  assert.ok(!Object.hasOwn(result, 'safe'));
  assert.ok(!Object.hasOwn(result, 'suitability'));
  assert.ok(!Object.hasOwn(result, 'fitScore'));
});

test('omitted or blank voluntary input returns label-only information', () => {
  assert.equal(checkLabel(hydro, '', catalog).status, 'label-only');
  assert.equal(checkLabel(gentle, ' \n\r\n ', catalog).status, 'label-only');
  assert.equal(checkLabel(gentle, undefined, catalog).status, 'label-only');
});

test('missing product, catalog, source identity, or label never yields no-overlap', () => {
  for (const result of [
    checkLabel(null, '', catalog),
    checkLabel(gentle, '', []),
    checkLabel({ ...gentle, sourceUrl: '' }, 'Glycerin', catalog),
    checkLabel({ ...gentle, ingredients: null }, 'Glycerin', catalog),
    checkLabel({ ...gentle, ingredients: [] }, 'Niacinamide', catalog),
    checkLabel({ ...gentle, market: 'Different market' }, 'Glycerin', catalog),
  ]) {
    assert.equal(result.status, 'insufficient');
    assert.ok(result.reasons.length > 0);
  }
});

test('incomplete documented list retains a known caution and uncertainty together', () => {
  const partial = { ...gentle, labelComplete: false, ingredients: ['Glycerin'] };
  const result = checkLabel(partial, 'Glycerin', catalog);
  assert.equal(result.status, 'caution');
  assert.deepEqual(result.overlaps, [{ input: 'Glycerin', ingredient: 'Glycerin' }]);
  assert.ok(result.reasons.some((reason) => reason.includes('incomplete')));
  assert.ok(result.reasons.some((reason) => reason.includes('differs')));
});

test('known caution and unresolved entry coexist without erasing either', () => {
  const result = checkLabel(hydro, 'Glycerin\nUnknown alias', catalog);
  assert.equal(result.status, 'caution');
  assert.deepEqual(result.unresolved, ['Unknown alias']);
  assert.equal(result.overlaps.length, 1);
  assert.ok(result.reasons.length > 0);
});

test('comma-containing ingredient remains literal and source spelling is not corrected', () => {
  assert.deepEqual(checkLabel(hydro, '1,2-Hexanediol', catalog).overlaps, [
    { input: '1,2-Hexanediol', ingredient: '1,2-Hexanediol' },
  ]);
  assert.equal(checkLabel(hydro, 'Lysine Hci', catalog).status, 'caution');
  assert.equal(checkLabel(hydro, 'Lysine HCl', catalog).status, 'insufficient');
  assert.equal(checkLabel(hydro, 'Glycerin, Niacinamide', catalog).status, 'insufficient');
});

test('unsourced aliases are never guessed or used for matching', () => {
  const withUnsourcedAlias = [{ ...gentle, aliases: [{ alias: 'Aqua', ingredient: 'Water' }] }, hydro];
  assert.equal(checkLabel(withUnsourcedAlias[0], 'Aqua', withUnsourcedAlias).status, 'insufficient');
});

test('explicitly sourced alias can resolve a documented ingredient without changing its display name', () => {
  const custom = structuredClone(catalog);
  custom[0].aliases = [{ alias: 'Test source alias', ingredient: 'Water', sourceUrl: 'https://example.org/reviewed-alias', reviewedAt: '2026-10-26' }];
  const result = checkLabel(custom[1], 'Test source alias', custom);
  assert.deepEqual(result.overlaps, [{ input: 'Test source alias', ingredient: 'Water' }]);
  assert.equal(result.status, 'caution');
});

test('ambiguous sourced aliases remain unresolved rather than picking one meaning', () => {
  const custom = structuredClone(catalog);
  custom[0].aliases = [{ alias: 'Ambiguous test alias', ingredient: 'Water', sourceUrl: 'https://example.org/a', reviewedAt: '2026-10-26' }];
  custom[1].aliases = [{ alias: 'Ambiguous test alias', ingredient: 'Glycerin', sourceUrl: 'https://example.org/b', reviewedAt: '2026-10-26' }];
  assert.equal(checkLabel(custom[0], 'Ambiguous test alias', custom).status, 'insufficient');
});

test('malformed input and duplicated product identities cannot produce a personal result', () => {
  assert.equal(checkLabel(gentle, { sensitivity: 'Glycerin' }, catalog).status, 'insufficient');
  assert.equal(checkLabel(gentle, 'Glycerin', [...catalog, gentle]).status, 'insufficient');
});

test('repeated calls and clearing input are stateless and never mutate source records', () => {
  const before = structuredClone(catalog);
  const first = checkLabel(gentle, 'Glycerin', catalog);
  assert.equal(checkLabel(hydro, 'Unknown entry', catalog).status, 'insufficient');
  assert.equal(checkLabel(gentle, '', catalog).status, 'label-only');
  assert.deepEqual(checkLabel(gentle, 'Glycerin', catalog), first);
  first.overlaps[0].ingredient = 'Changed result';
  assert.equal(checkLabel(gentle, 'Glycerin', catalog).overlaps[0].ingredient, 'Glycerin');
  assert.deepEqual(catalog, before);
});

test('cosmetic scores and commercial metadata cannot change a label check', () => {
  const baseline = checkLabel(hydro, 'Niacinamide', catalog);
  const decorated = { ...hydro, ui_score: 100, raw_score: 1, commission: 1000, price: 0 };
  assert.deepEqual(checkLabel(decorated, 'Niacinamide', catalog), baseline);
  const other = { ...hydro, ui_score: 1, raw_score: 100, commission: 0, sponsored: true };
  assert.deepEqual(checkLabel(other, 'Niacinamide', catalog), baseline);
});
