---
doc: prd
status: approved
prior-status: approved
revision-date: 2026-10-26
consultation-approval-date: 2026-10-26
revision-handling: internal-detail-within-approved-journey
prior-approval-date: 2026-10-26
---

# Skinny — Product Requirements

**Approved journey and recorded implementation details.** The consultation flow and dry-feeling-skin focus were approved on October 26, 2026. [The implementation record](consultation-delta.md) documents conservative care/unknown, educational/catalog and affected-order details within that flow. The existing checker, design, browser/Node architecture, privacy boundaries and fast mode remain in place.

Source: `scope.md > The Unique Kernel`, `The Core Loop`, `The POC Boundary`. The learner chose the project name **Skinny** on October 26, 2026.

## The Core Journey

1. Open a calm consultation page for **dry-feeling skin**. Explain its educational/cosmetic limits, with no clinician persona or account requirement.
2. Give concern/duration, recent changes, routine and optional known sensitivities. Complete a short explicit care check; missing or uncertain answers stay unknown.
3. Where a reported warning/review condition applies, show the appropriate source-linked care route before scan/product suggestions. No score can override this. The implementation record defines bounded structured branches, without clinical triage claims.
4. For the supported path, optionally consent to a genuine YouCam cosmetic observation. Decline, not connected, loading and error remain explicit; a scan is not required for general education.
5. Read an evidence-separated summary: what was reported, cosmetic observation, educational next steps, product considerations/label cautions, and when to seek care. The existing catalog checker supports that summary without inferring tolerance.
6. Edit answers or clear/reload to invalidate/remove page-held context and results. This cannot undo provider processing.

The displayed journey is approved. Conservative care/unknown handling, educational rules and acceptance cases are documented in [the implementation record](consultation-delta.md).

## Screens and Layout

Keep one responsive page and the implemented editorial visual system. Present a short staged consultation with clear progress, Back/Continue, visible optional fields, and one primary action per stage. The result is an editorial reading surface rather than a dashboard. Place catalog comparison/checking inside the product-considerations section; the disabled observation panel is not the centerpiece. Keep care routes, sources, uncertainty, reset and keyboard focus readable on narrow screens. This organizes the approved journey; no account/history or extra destination is introduced.

## Look and Feel

The requested simplification presents one short question per step, compact summary/next action and progressive disclosure for supporting sources, context and ingredients. Critical warning questions/help and upload/retention consent remain visible when relevant. Behavior, privacy and editorial direction are preserved.

The approved editorial direction uses larger local serif display type, readable sans-serif body, warm ivory, charcoal and muted terracotta. Keep fewer boxes, a flat two-product comparison, one clear primary action per consultation stage and readable summary sections. Preserve explicit caution/uncertainty language, keyboard focus, provenance and the absence of safe/fit badges.

## Features and Behavior

### Consultation Intake and Care Routing

Approved intent: concern, recent changes, routine, optional known sensitivities, and warning signs that call for professional care. Implementation detail: structured answers and the explicit care groups/precedence in `consultation-delta.md > Intake and care check`. Do not parse free text/photos for symptoms or diagnoses. Unknown/skipped answers never mean no; no all-negative checklist establishes health. Context not needed for a branch can be skipped, and no cause is inferred from recent changes.

### Educational Guidance and Product Considerations

Source-backed rules are in `consultation-delta.md > Guidance and product considerations`. Show brief general education, visible sources and reasons, never a diagnosis, medication change or guaranteed outcome. The same two source-reviewed moisturizers remain catalog examples with factual provenance and label cautions; no cosmetic-score-based suitability or best-product ranking. A scan failure/decline cannot change care/guidance or label rules. Unsupported concerns receive an honest boundary and source-linked professional-care guidance.

### Cosmetic Observation and Consent

- Explain that YouCam provides a cosmetic observation, not diagnosis, health percentage, product compatibility, or allergy detection. `texture` is the documented first cosmetic signal in the carried-forward adapter plan; it does not measure or diagnose dry skin.
- Show accepted image requirements, permission/consent notice, provider processing and retention limits, and a way to decline. Provider result availability and data retention are distinct; never promise immediate provider deletion.
- Require explicit consent and an **Analyze photo** action before transmission. Do not send known sensitivities with the image. No actual upload is authorized merely by approving this PRD.
- Care holds take precedence over scan availability; the exact care/unknown policy is in the delta. Keep the prior approved provider contract/limits.
- Show progress and provider failures honestly. When a task's outcome is uncertain, offer status/recovery rather than silently starting another chargeable request. An unconfigured provider shows **Not connected**, never a fabricated result.

### Catalog and Label Check

- Two source-reviewed U.S. candidates: Neutrogena Ultra Gentle Daily Facial Moisturizer, non-SPF, 3.4 fl oz; and Neutrogena Hydro Boost Hyaluronic Acid Water Cream Fragrance Free Facial Moisturizer, 1.7 fl oz. Preserve exact identity, ingredient names, source, and review date; package/lot equivalence is not assumed. See [catalog evidence](catalog-evidence.md).
- Show the selected product's documented ingredient list and limitations. Manufacturer-source links establish provenance; they are not buying or affiliate controls.
- Accept voluntary known sensitivities one per line. Check documented names or explicitly sourced aliases only; unresolved entries stay visible as unresolved. Do not infer sensitivity from photos, ingredient order, marketing text, or cosmetic score.
- A documented overlap shows **Caution — documented ingredient overlap**, naming the entered sensitivity and matching label ingredient. It does not diagnose allergy.
- An incomplete/mismatched label or unresolved sensitivity shows **Insufficient information** with the reason. If a known overlap also exists, preserve its caution alongside that uncertainty.
- With complete reviewed information and no documented overlap, say **No supplied sensitivity found in this label; this does not establish tolerance or suitability**. With no sensitivity input, show **Label information only**.
- Changing the product/input clears the previous check until checked again. Cosmetic results and sponsorship/commission information never alter the outcome or product order.

Source: scope's **The POC Boundary**; [product evidence and limits](product-evidence.md).

### Acceptance Checks

- Approved journey can be followed from context through a separate-evidence summary, with scan skipped/unavailable and the existing label component correct.
- Cases in `consultation-delta.md > Verification Cases` cover ordinary explicit-negative answers, every emergency/review flag, missing/contradictory answers, persistence/reactivity, scan invariance, repeated edits/reset, keyboard and responsive layout.
- Existing matcher rules remain: overlap caution, unknown/incomplete data insufficient information, qualified no-overlap and blank-input label-only. No photo or score changes those results.
- Consent/action is required for transmission; real authorized YouCam acceptance is still required before claiming live integration. Fixtures never satisfy that gate.

Actual consultation and preserved-component verification is recorded in `verification.md`; one real API acceptance is recorded in [provider integration](provider-integration.md); final hands-on review remains incomplete.

## States and Boundaries

- **First use:** no sensitive inputs or preselected care answers; explain dry-feeling-skin scope and optional context/scan.
- **Care hold:** explicit emergency/professional-review guidance, or unknown-answer information, takes precedence over product/scan output as defined in the implementation record. Never label a person safe/cleared.
- **Unsupported concern:** explain scope and professional-care route; no improvised diagnosis/guidance.
- **Scan skipped/unavailable/error/uncertain:** preserve the observation's honest state; no fake score or duplicate task; care/guidance and label output stay independent.
- **Catalog missing/uncertain:** insufficient information, not invented ingredients or positive suitability.
- **Edits/clear/reload:** invalidate dependent results/eligibility; discard page-held context/photos/results; no personal history. Provider retention is separately disclosed.
- **Safety limits:** no automated photo/free-text disease detection, prescription/medication changes, prevention/tolerance guarantee, or clinical-validation claim.

## Product Decisions

- **Approved October 26, 2026:** consultation flow and dry-feeling-skin first track, with no diagnosis/prescriptions and the checker supporting the journey.
- **Carried forward:** editorial design, exact catalog/uncertainty behavior, optional sensitivities, no account/history, informed photo consent, privacy, browser/Node and fast mode.
- **Implementation detail:** conservative source-reviewed care/unknown, educational/catalog and affected-order rules preserve the approved behavior without adding a model service or clinical claim.

## What We're Building

A bounded dry-feeling-skin consultation with volunteered context, source-backed care guidance, optional genuine cosmetic observation, an explainable educational summary, and the preserved label checker as a supporting component. The checker/editorial design are implemented; the revised consultation is now implemented; the adapter and consent UI are implemented/offline-verified; one specifically authorized official-sample analysis is verified in [provider integration](provider-integration.md); final readiness remains pending.

## Deferred From the POC

Additional concern tracks, open-ended medical chat, individual efficacy predictions, larger catalog automation, full routine planning, accounts/saved history, clinician integration and monetization. No automatic expansion follows from “skin doctor”.

## Non-Goals

Clinical scoring/diagnosis, treatment selection, numerical fit/safety percentages, guaranteed prevention/tolerance, automatic symptom detection, shopping/affiliate links, purchases, public deployment, and native-store release. Cosmetic observations do not validate product suitability.

## Open Questions

- **Next checkpoint:** meaningful early hands-on feedback on the running consultation. Journey/first concern/design/stack/fast mode are settled; no duplicate planning approval.
- **Before live integration:** authorized existing provider access/units and a lawful informed-consent test image; no new signup/credentials or transmission implied.
- **Before submission:** learner-authored required fields/survey/reflection, publication/license decision, working demonstration and final hands-on review.

## Prior Approval Record

The earlier independent-panel PRD was approved on October 26, 2026. It is historical context, superseded by the consultation revision below; exact approval evidence remains private.

## Consultation Journey Approval

The consultation flow and dry-feeling-skin first track were approved on October 26, 2026. Conservative details in the implementation record preserve that boundary. This does not claim clinical validation, final learner readiness or authorization for additional images, spending or publication.
