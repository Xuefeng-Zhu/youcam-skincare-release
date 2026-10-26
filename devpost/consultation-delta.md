---
doc: consultation-delta
status: active
consultation-approval-date: 2026-10-26
---

# Consultation implementation record

The four-step consultation journey and dry-feeling-skin first track were approved on October 26, 2026. This records conservative implementation details inside that approved flow, not a new architecture, clinical claim or additional service. The browser/Node stack, privacy boundaries, editorial design and fast mode are retained.

## Already Approved and Preserved

Concern/recent changes/routine/optional sensitivities → warning-sign check → optional consented cosmetic observation → explainable educational next steps and product considerations. Preserve the editorial design, plain browser/Node architecture, browser-memory privacy, tested checker, server-only key, bounded provider requests, and fast mode. No accounts, history, clinical diagnosis, prescriptions, monetization, or new external AI service.

## Implementation of the Approved Behavior

### Intake and care check

Use short structured answers, never free-text or photo interpretation for care routing. Ask about dry feeling and duration, recent changes, cleanser/moisturizer use, and optional known sensitivities. Context may be skipped; missing context is not invented. Other concerns get an explicit unsupported-track boundary.

For care questions, offer **Yes / No / Not sure / Prefer not to answer**, with no preselected answer:

| Question group | Implemented consequence |
| --- | --- |
| Current breathing/swallowing difficulty, or new/sudden swelling around eyes or of lips/mouth/tongue/throat? | An explicit yes immediately shows emergency-help guidance, without waiting for form submission, and stops scan/product suggestions. Call the local emergency number; show 911 as a clearly U.S.-specific example. Do not wait for a photo or name a diagnosis. |
| Rash covering most of the body, blistering/open/raw skin, rapid spread, pain, fever/feeling ill with rash, or eyes/lips/mouth/genital skin involved? | An explicit yes pauses scan/product suggestions and directs medical evaluation, without inventing a fixed waiting period or classifying every sign as an emergency. |
| Dryness continuing despite basic gentle care, or applied products causing burning/stinging/irritation? | An explicit yes recommends discussing this with a dermatologist, and withholds product suggestions/scan rather than guessing a cause. Self-care cards are withheld on this medical-review path; source-linked professional guidance remains available. |
| Any care answer missing, not sure, declined, or contradictory? | Keep **unknown**. Show safety information and general education; hold scan/product suggestions until clarified. Never label the person safe/cleared. |

Precedence: explicit emergency answer first, then other explicit care-review answers, then unknown, then the ordinary supported path. Editing an answer invalidates the previous summary and pending scan eligibility. All negative answers mean only that none of the **asked** signs was reported. These are conservative product rules, **not a clinically validated triage algorithm** or a complete emergency checklist. [AAD rash guidance](https://www.aad.org/public/everyday-care/itchy-skin/rash/rash-101), [FDA cosmetic allergens](https://www.fda.gov/cosmetics/cosmetic-ingredients/allergens-cosmetics), [NHS emergency symptoms](https://www.nhs.uk/conditions/anaphylaxis/)

### Guidance and product considerations

For the supported path, show a short source-linked educational set: gentle cleansing, short warm washing, patting dry, and moisturizing while skin is damp. General cream/ointment and fragrance-free category information can explain what to look for. Routine answers can select a relevant explanatory card; they cannot establish a cause. Persistent or reactive symptoms point toward professional review. Do not change prescriptions or add medication advice. [AAD dry-skin guidance](https://www.aad.org/public/everyday-care/skin-care-basics/dry/dermatologists-tips-relieve-dry-skin)

Keep the existing two U.S. moisturizer records as transparent **catalog examples**, with exact identity/source/date and the existing label checker. Show why the moisturizer category is relevant and what the label check does/does not establish. An ingredient overlap remains a caution; unknown data remains insufficient information; no overlap never becomes a recommendation of tolerance. Do not rank either product as best, infer efficacy/concentrations, generalize ingredient-name substrings, or let a cosmetic score/sponsorship change the output. A verified category consideration is not a personalized efficacy claim. [Catalog evidence](catalog-evidence.md), [FDA label limits](https://www.fda.gov/cosmetics/cosmetics-labeling-regulations/cosmetics-labeling-guide)

The summary keeps **You told us / Cosmetic observation / Educational next steps / Product considerations / When to seek care** separate. Skipping or failing a scan leaves the observation explicitly absent and does not alter care routing, guidance, or label outcomes. `texture` is a cosmetic signal, not a dryness diagnosis or product-selection score.

## Technical Delta and Build Order

No new architecture choice: a pure browser consultation/rule module is added and versioned source-reviewed content beside the existing matcher. Keep context, care answers, sensitivities, and summary in browser memory only, out of URLs/logs/provider payloads. Use the implemented guarded provider adapter; no extra model/API or database. Clear/reload removes local page-held context; it cannot undo provider processing.

1. **Usable consultation without a scan:** intake → care branches → source-linked summary and the preserved catalog component. Test and show this revised journey for early feedback. Observation stays honestly unavailable.
2. **Guarded observation integration:** connect consent/status/error controls and the previously planned server adapter; verify disabled, visibly simulated fixture, and live-capable contracts offline. A care hold overrides scan controls. Fixture results are development evidence only.
3. **Real acceptance and final review:** only after separately authorized existing account/units and a permitted consented image, verify one real API result; then learner hands-on review, fixes and honest demo capture. No live request is authorized by approving this delta.

The first slice changes the product journey before additional provider work; the second addresses the external boundary; the third supplies actual integration evidence. Fast mode and meaningful early/final feedback stay in place. Prior checker evidence is preserved; new consultation evidence is recorded separately in `verification.md`.

## Verification Cases

| Case | Expected evidence |
| --- | --- |
| Ordinary explicit-negative care answers + dry feeling | Source-linked general summary; no diagnosis/clearance claim; existing label outcomes remain correct. |
| Every emergency answer, even with a favorable fixture cosmetic score | Emergency guidance takes precedence; scan/catalog suggestions unavailable; no diagnostic label. |
| Each rash/review flag, persistent dryness, or product reactivity | Care-review route with appropriate source; no precise invented deadline or prescribed treatment. |
| Missing, declined, unknown, invalid, contradictory answers | Unknown survives; explicit yes retains priority; no personalized recommendation, safe badge, or scan eligibility. |
| Skipped/failed scan, score changes, or different product | Care/guidance rules are invariant; existing matcher remains independent of score. |
| Edits, repeated actions, reset/reload, hostile text | Previous results invalidated, no duplicates/stale eligibility, text safely rendered, local inputs cleared. |
| Desktop/mobile and keyboard | Logical focus/labels, readable sources/cautions, no overflow, no sensitive network/URL/log data. |

Keep existing catalog/HTTP tests. Focused rule/browser checks verify the consultation; the recorded full offline suite has 96 passing tests. One specifically authorized real official-sample acceptance passed, as recorded in [provider integration](provider-integration.md).

## Current Checkpoint

No extra approval is needed for these conservative details implementing the already-approved warning-sign/educational journey. Do not repeat scope/PRD/stack/fast-mode approval. Actual early feedback was received and addressed. Final learner retry/readiness and the learning wrap-up remain incomplete; agent QA is not learner acceptance or clinical validation. The completed sample authorization does not extend to future images or analyses.
