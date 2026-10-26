---
doc: product-evidence
status: draft
---

# Product Evidence and Recommendation Limits — Draft

Research date: October 26, 2026. This is an unapproved planning aid, not medical advice, a validated matching model, a completed catalog, or an implementation. No personal information was sent to a provider. Only public documentation was read.

## Verified Evidence and Proposed Consequences

| Primary source | Verified point | Proposed product consequence; requires plan review |
| --- | --- | --- |
| [Perfect Corp. AI Skin Analysis](https://docs.perfectcorp.com/reference/ai_skin_analysis), score descriptions | `ui_score` adjusts raw results toward more favorable beauty evaluations. The page describes cosmetic signals and image-quality requirements. | Display a cosmetic observation, never confidence, percentage healthy, diagnosis, or proof of product tolerance. This research did not establish clinical validation or ingredient compatibility prediction. |
| [FDA cosmetic/drug distinction](https://www.fda.gov/cosmetics/cosmetics-laws-regulations/it-cosmetic-drug-or-both-or-it-soap) | Intended use matters; disease prevention/treatment claims differ from cosmetic appearance uses. | Keep the proposed promise educational and cosmetic. Do not repeat the user's broad prevention aspiration as a demonstrated capability or claim. This is a scope constraint, not a legal classification of the future app. |
| [FDA Cosmetics Labeling Guide](https://www.fda.gov/cosmetics/cosmetics-labeling-regulations/cosmetics-labeling-guide), ingredient declaration | Ingredients generally follow predominance order; those at 1% or less may follow in any order. Concentrations need not be declared. | Design inference: ingredient order alone cannot supply exact concentration, pH, efficacy, or a personalized compatibility percentage. Do not invent these fields. |
| [FDA Allergens in Cosmetics](https://www.fda.gov/cosmetics/cosmetic-ingredients/allergens-cosmetics) | Known sensitivities and ingredient panels matter. Fragrance components may be grouped. Terms including hypoallergenic lack a federal standard in the U.S. | Match only documented ingredients/aliases against voluntarily supplied known sensitivities. Absence of a match is not proof of tolerance; grouped fragrance or missing labels can leave uncertainty. |
| [AAD product-testing guidance](https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products) | A skin-type-based choice can still irritate. A dermatologist may help identify a cause; professional patch testing is distinct from choosing a product. | Link to professional guidance without claiming an app/photo detects allergy. Do not recommend retrying a product that caused a reaction or turn home testing into allergy diagnosis. |

## Conservative Decision Boundary

Implemented boundary within the approved consultation; final learner readiness remains pending:

- Optional known sensitivities are checked only against documented ingredients and sourced aliases. A documented overlap produces a caution, not a diagnosis. Ingredient-name equivalences need reviewed sources; no guessed synonym expansion. No sensitivity input means label information only.
- Missing, stale, variant-mismatched, or incomplete ingredient information yields **insufficient information**. A grouped fragrance declaration can prevent resolving a specific sensitivity.
- A result with no documented overlap means only that no supplied sensitivity was found in the available list. It must not say safe, allergy-free, or guaranteed suitable. Do not infer sensitivities from an image.
- The tiny default provides static, source-linked safety guidance, not automatic symptom detection. FDA identifies breathing/swallowing difficulty or loss of consciousness among emergency allergic-reaction symptoms and directs immediate emergency care; its page specifies 911 for the U.S. Use appropriate local wording. Persistent or difficult-to-explain reactions call for professional evaluation, not automated treatment selection. A later self-reported symptom gate that pauses shopping would need explicitly defined intake and separate approval; none is assumed here. [FDA](https://www.fda.gov/cosmetics/cosmetic-ingredients/allergens-cosmetics), [AAD](https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products).
- Keep sponsorship/commission fields out of suitability inputs and ordering. If monetization is later approved, disclose it visibly. No affiliate registration, commercial link, purchase, or revenue model has been implemented or selected.

## Tiny Catalog Feasibility Sample

**Unapproved category proposal: ordinary moisturizers.** This demonstrates that primary ingredient sources exist; it does not select the first concern, rank these products, or recommend either to the learner.

| Possible research entry | Official U.S. source checked October 26, 2026 | Verified factual example and limits |
| --- | --- | --- |
| Neutrogena Ultra Gentle Daily Facial Moisturizer, non-SPF, 3.4 fl oz | [Official U.S. manufacturer page](https://www.neutrogena.com/products/neutrogena-ultra-gentle-daily-facial-moisturizer-3.4-fl.-oz/6806768) | The displayed label lists 22 ingredients, including exact-spelling `Glycerin`. Size/variant are exposed; physical lot/formulation date remain unverified. |
| Neutrogena Hydro Boost Hyaluronic Acid Water Cream Fragrance Free Facial Moisturizer, 1.7 fl oz | [Official U.S. manufacturer page](https://www.neutrogena.com/products/skincare/neutrogena-hydro-boost-water-cream-fragrance-free/6806486) | The displayed label lists 39 ingredients, including `Glycerin`. This is Water Cream, not Water Gel, Gel Cream, or an SPF variant. Physical lot/formulation date remain unverified. |

The runtime catalog freezes these two exact U.S. variants with reviewed label arrays, source URLs and dates. [Catalog evidence](catalog-evidence.md) distinguishes that snapshot from unverified physical-package/lot equivalence. Do not merge markets/variants or treat a webpage as permanently current. Synthetic `Glycerin` tests exact-name overlap only; it does not infer an allergy or product effect. No product images, prices, ratings or retailer links are included.

## Still Unknown Before Implementation

The approved first track is dry-feeling skin, with the source-backed catalog checker supporting the consultation. Personalized shopping discovery/recommendations remain outside this version. No evidence here supports a numerical fit score, routine-interaction engine, personalized efficacy estimate, diagnosis, or treatment recommendation. Any additional claim needs its own adequate evidence and review.

The reviewed catalog records and literal matching rules are implemented and tested; package/lot equivalence and clinical effectiveness remain unestablished. Later verification should exercise documented overlap, missing-label/unknown-alias uncertainty, no-overlap caveats, absent sensitivity input, static safety guidance, and invariants that cosmetic-score/sponsorship changes do not alter label checks. The separately authorized real provider acceptance is recorded in [integration evidence](provider-integration.md); fixture results alone do not prove it.
