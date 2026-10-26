---
doc: checklist
status: approved
prior-status: approved
revision-date: 2026-10-26
consultation-approval-date: 2026-10-26
revision-handling: internal-detail-within-approved-journey
prior-approval-date: 2026-10-26
---

# Build Checklist

**Approved journey and build order retained.** The consultation/dry-feeling-skin journey, existing stack, privacy boundaries and fast mode were approved on October 26, 2026. [The implementation record](consultation-delta.md) records source-reviewed details inside that flow and affected slices. No duplicate planning approval is needed.

**Preserved baseline:** the verified catalog/matcher, local Node server, responsive checker and consultation remain intact. The full offline suite has 96 passing tests, and one authorized official Sample 1 analysis now returned cosmetic texture `uiScore` 74 through the app. HTTP-200 balances 1,000 → 991 confirm nine existing free units and $0 paid spending, with one Analyze action. The learner confirmed the current app ready after a walkthrough on October 26, 2026. The full-frame narrated recording is complete; public-video access and formal submission are tracked separately.

Build mode: fast — less explanation, full mechanical checks and meaningful early/final feedback.

## Slices

- [x] **1. Complete a source-backed dry-feeling-skin consultation**
  Becomes usable: The existing page becomes a guided intake/care-check/educational-summary journey, with the verified catalog checker as a supporting component and observation honestly disabled. Explicit care/unknown branches take precedence over scan/product suggestions.
  Why now: Delivers the newly approved central journey and its consequential evidence/uncertainty behavior before further provider work; preserves the existing useful component.
  PRD ref: `prd.md > The Core Journey`, `Consultation Intake and Care Routing`, `Educational Guidance and Product Considerations`, `Catalog and Label Check`, `Look and Feel`, `States and Boundaries`.
  Spec ref: `spec.md > Consultation Rules and Source Content`, `Browser Page and Lifecycle`, `Frozen Catalog and Label Checker`, `Look and Feel`, `Verification Strategy`.
  Build: Implement the approved journey using the source-reviewed internal record; add structured context/care controls, versioned reviewed education and a pure consultation/rule module, evidence-separated summary, existing checker integration, edits/reset and keyboard/responsive behavior. Keep sensitive answers in browser memory, outside requests/logs/URLs; do not build a diagnostic chatbot or new service.
  Verify (mechanical): Run `npm test` for existing checks plus focused ordinary/emergency/review/unknown/contradiction/persistence/reactivity/source-invariant cases. Open the revised page in the user's Mac browser; exercise ordinary and held journeys, scan skip, unknown label, editing/repeated actions, clear/reload, desktop/mobile/keyboard and no context network leakage. Record actual outcomes, not predicted passes.
  Learner check: Open `http://127.0.0.1:8787/`, use made-up context to try an ordinary dry-feeling-skin journey and an uncertain care answer, then review the summary/catalog component and report what feels useful, confusing or missing. This is the revised early feedback checkpoint; no actual photo is required.
  Commit: `Build source-backed dry-skin consultation journey`

- [x] **2. Add guarded cosmetic observation with offline verification**
  Becomes usable: The consultation has consent/status/error controls and a server-side live-capable adapter with explicit disabled/fixture/live modes, integrated with care holds; no provider call is needed for offline verification.
  Why now: The consultation is useful first; now prove the image/task boundary, mode honesty and care precedence before any separately authorized live request.
  PRD ref: `prd.md > Cosmetic Observation and Consent`, `Consultation Intake and Care Routing`, `Acceptance Checks`, `States and Boundaries`.
  Spec ref: `spec.md > Local Server and Request Policy`, `YouCam Adapter and Explicit Modes`, `Browser Page and Lifecycle`, `Data Model`, `External Services and Dependencies`, `Verification Strategy`.
  Build: Implement the carried-forward server-only provider contract/limits, explicit consent, progress/status recovery, disabled/fixture/live modes, local forget behavior and late-result invalidation after answer edits. A care hold overrides scan controls. Fixture mode sends no photo and remains visibly simulated; live failures never become fixture success. Do not transmit context/care/sensitivity answers.
  Verify (mechanical): Run `npm test` for mocked upload/task/status stages, auth/quota/429/malformed/timeout recovery, 8,000,000-byte cap, origin/consent/rate/concurrency and no duplicate task/secret/context leakage. Inspect fixture/disabled browser journeys at desktop/mobile sizes and by keyboard; verify no YouCam traffic, no upload in fixture mode, care/unknown precedence, stale-result invalidation and clear/reload.
  Learner check: Try the integrated offline consultation and clearly labeled sample-observation path, including decline/error and a care hold; report any misleading result or mode. Sample observation is not evidence of a real API result.
  Commit: `Add guarded observation adapter to consultation`

- [x] **3. Finish final readiness after verified live acceptance**
  Becomes usable: The real API portion is verified: official Sample 1 returned cosmetic texture uiScore 74 through the app using nine free units and $0 paid spending. The learner has confirmed final readiness, and genuine full-frame demo evidence has been reviewed. Care/guidance/checker outcomes remain independent; public-video access and submission remain separate release actions.
  Why now: Actual provider acceptance follows safeguards and separate access/image authorization; offline samples cannot complete the live kernel.
  PRD ref: `prd.md > Cosmetic Observation and Consent`, `Educational Guidance and Product Considerations`, `Acceptance Checks`, `States and Boundaries`.
  Spec ref: `spec.md > External Services and Dependencies`, `Important Failure Modes`, `Verification Strategy`, `Decisions and Open Issues`.
  Build: Do not repeat the successful authorized live task. Preserve its sanitized evidence, resolve actual final learner feedback, repair/reverify any agreed fixes, and complete/review honest demo capture. Do not invent narration, readiness, publication or submission; new analyses or personal-image use need appropriate authorization.
  Verify (mechanical): Real upload/task/result acceptance passed once, with HTTP-200 free balances 1,000 → 991 and no second Analyze action; see provider-integration.md. Retain the 96-test offline baseline and rerun affected checks only if fixes change code. The completed recording was checked for framing, playback, privacy and genuine result evidence. Final learner readiness was explicitly confirmed after the walkthrough; public hosting is tracked separately.
  Learner check: Explore the final running consultation, report issues, retry fixes and explicitly confirm readiness. Final hands-on review and lawful photo/API authorization are separate from planning approval.
  Commit: `Verify real consultation observation and demo readiness`

## Hands-on Checkpoints

Prior checker/design verification remains preserved. Feedback requested a consultation-like journey and simpler copy. Those changes were implemented and mechanically checked, and the learner explicitly confirmed the current app ready after the walkthrough. Planning approval and this later readiness confirmation are separate evidence.

- [x] Early usable feedback received and addressed — the learner requested simpler copy/steps; the requested revision was implemented and verified. Learner retry is folded into final review; this box does not claim acceptance of the revised interface.
- [x] Final kick-the-tires exploration and feedback completed — the learner confirmed the current app ready after the walkthrough on October 26, 2026.

## Final Review

- [x] Final review complete — requested consultation and copy changes were resolved, affected checks passed, and the learner confirmed readiness after the walkthrough. Publication and formal entry submission remain separate actions.

## Code Tour and App Map

- [x] Project-grounded learning recap shared — connect the learner's consultation and nondiagnostic-scope feedback to the implemented separation between product-label evidence, cosmetic observation and care warnings.
- [x] `devpost/app-map.html` generated from finished code and browser-rendered; the public map is linked from the README.
- Optional code edit and personal reflection were not performed and are not required for this close-out. No exercise, mastery or personal learning claim is invented.

Route and takeaway: `public/app.mjs` calls `checkLabel` in `public/label-check.mjs` to render label cautions or insufficient information. Cosmetic observation follows the separate `server.mjs` / `lib/youcam.mjs` boundary. The scan score never changes allergy cautions or care warnings. The recap was shared on October 26, 2026; it connects the learner's actual product feedback to an evidence-separation practice they can reuse.

## Revisions

- October 26, 2026: editorial typography/hierarchy was revised within the existing checker behavior and privacy boundary.
- October 26, 2026: the consultation journey and dry-feeling-skin focus were approved; the verified checker became a supporting component. Only affected plans and remaining slices changed.
- Conservative source-reviewed care/unknown rules and education were implemented within that flow; no diagnosis, new model service or architecture rewrite was added.
- Actual early feedback requested less text. One-question steps and shorter summaries were implemented and mechanically verified; the learner later confirmed readiness after the walkthrough.
- Slices 1–2 are implemented and verified. The full offline suite has 96 passing tests. Explicit fixture and isolated fake-transport browser checks are separate from real provider evidence.
- One specifically authorized official-sample analysis passed with texture uiScore 74. HTTP-200 balances of 1,000 then 991 establish nine existing free units and $0 paid spending. No repeated analysis is needed.
- A full-frame 1:42 narrated recording is complete and verified. The learner confirmed final readiness and received a brief code-map recap. Public-video access and formal submission are tracked separately; neither is claimed here.
