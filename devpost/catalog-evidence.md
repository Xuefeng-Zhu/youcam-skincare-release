---
doc: catalog-evidence
status: draft
last-reviewed: 2026-10-26
---

# Two-product catalog evidence — draft proposal

These two source-reviewed records are now frozen in `public/catalog.json` for the approved first prototype. They are not recommendations or verified matches to a physical package. Both official pages target U.S. visitors and were freshly inspected October 26, 2026 UTC; the full displayed lists have 22 and 39 entries. Manufacturer label text is source evidence, not independently verified efficacy.

| Record candidate | Exact market/variant and source | Verified label metadata |
| --- | --- | --- |
| Ultra Gentle | United States; Neutrogena Ultra Gentle Daily Facial Moisturizer, 3.4 fl oz, non-SPF. [Official page, product 6806768](https://www.neutrogena.com/products/neutrogena-ultra-gentle-daily-facial-moisturizer-3.4-fl.-oz/6806768) | 22 listed ingredients; `Glycerin` is an exact listed name. The page gives daily post-cleansing face/neck use, topical-only/eye-contact/children precautions, and a quality-seal precaution. These are label directions, not personalized instructions. |
| Hydro Boost Water Cream | United States; Neutrogena Hydro Boost Hyaluronic Acid Water Cream Fragrance Free Facial Moisturizer, 1.7 fl oz. [Official page, product 6806486](https://www.neutrogena.com/products/skincare/neutrogena-hydro-boost-water-cream-fragrance-free/6806486) | 39 listed ingredients; `Glycerin` is an exact listed name. The page gives daily post-cleansing face/neck use and topical-only warning. This exact Water Cream variant must not be merged with Water Gel, Gel Cream, SPF versions, other sizes, or other markets. |

## Proposed freeze and verification boundary

For each of the two records, preserve exact product identity, market, size/variant, source URL, reviewed date, displayed ingredient names/order, and label directions/warnings. Use a manually reviewed snapshot; do not parse an ingredient list by blindly splitting every comma: `1,2-Hexanediol` is one ingredient. Preserve the Water Cream source spelling `Lysine Hci`; any correction or alias needs a separate authoritative source. No aliases are approved by this document.

The page/variant metadata and full lists are frozen with source/review dates in the runtime catalog. No aliases are supplied. UPC/SKU beyond the page identifier, physical-lot label, formulation date, and equivalence to a user's package remain unverified. Do not infer concentration, pH, price, clinical benefit, tolerance, or suitability. Recheck the actual package before describing a package-specific check.

## Testable proposal

Use a **synthetic**, explicitly hypothetical known-sensitivity input `Glycerin` to exercise documented exact-name overlap and a caution message. The example does not say the learner or any real person is allergic to it. An incomplete label or an unsourced alias must exercise **insufficient information**. No documented overlap must still state that tolerance/suitability is unestablished; absent sensitivity input means label information only.

Cosmetic scores and commission/sponsorship are absent from the implemented matcher inputs. The recorded full offline suite has 96 passing tests, including 16 catalog/matcher tests. Actual early feedback was addressed. One separately authorized provider-sample analysis is recorded in [provider integration](provider-integration.md); no personal-image acceptance or final learner readiness is claimed.
