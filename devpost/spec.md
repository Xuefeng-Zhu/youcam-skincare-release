---
doc: spec
status: approved
prior-status: approved
revision-date: 2026-10-26
consultation-approval-date: 2026-10-26
revision-handling: internal-detail-within-approved-journey
prior-approval-date: 2026-10-26
---

# Skincare Prototype — Technical Spec

**Approved architecture carried forward.** The consultation/dry-feeling-skin journey was approved on October 26, 2026. The existing browser/Node stack, privacy boundaries, provider safeguards and fast mode remain approved. The consultation/checker and all observation modes are implemented. [One specifically authorized live acceptance](provider-integration.md) passed; final learner readiness remains pending.

## How This Works, In Plain Language

The local page asks brief questions and assembles a source-linked educational summary on the device. A small pure rule module keeps self-reported care answers separate from cosmetic observations and product labels. The existing label checker supports product considerations. None of the context/routine/sensitivity answers needs to leave the browser.

Separately, the previously planned Node adapter can handle a consented photo and server-only YouCam key when separately authorized. It does not diagnose dryness or choose products. Keep the existing stack and privacy; no database, account, extra AI API, or cloud deployment is needed.

## The Core Journey Through the System

1. The server serves the page, versioned educational content, existing catalog and browser modules through its explicit allowlist.
2. Browser memory holds structured context/care answers and optional sensitivities. The pure consultation module returns the source-linked branch and section identifiers using explicit answers only, never free text/photo interpretation or cosmetic scores.
3. The page shows care/unknown output before scan or product suggestions. The exact precedence and hold behavior are in `consultation-delta.md > Intake and care check`; these implement the approved warning-sign behavior and uncertainty limits.
4. On the supported path, the page combines relevant general-education cards, separate voluntary context, and existing label-check results. Declined/unavailable/failed cosmetic observation stays visibly absent.
5. Only a permitted live mode plus explicit photo consent/action can send image bytes through the existing bounded Node/provider flow. Context/care/sensitivity answers are absent from server/provider requests.
6. Editing answers invalidates the summary and prior eligibility. A care hold stops local waiting and discards late results; if an operation exists, use the planned local forget action without promising provider cancellation. Reset/reload clears page-held inputs, results and previews.

Implements `prd.md > The Core Journey`, `Consultation Intake and Care Routing`, `Educational Guidance and Product Considerations`, `Catalog and Label Check`, and `Cosmetic Observation and Consent`.

## Stack

| Recommended tool | Reason and verification |
| --- | --- |
| HTML, CSS, browser JavaScript modules | One responsive page without a UI framework or build pipeline. Native form controls and text-only rendering reduce complexity. [Browser modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) |
| Node 24, plain `.mjs` modules | Already available: Node `v24.14.1`; npm `11.19.0`. Use built-in [HTTP](https://nodejs.org/api/http.html), [fetch/AbortSignal](https://nodejs.org/api/globals.html), and [crypto](https://nodejs.org/api/crypto.html). No runtime npm dependency or install is needed. |
| Node native test runner | Focused pure-function and HTTP/provider-contract tests with [node:test](https://nodejs.org/api/test.html); available `--test` and `--env-file-if-exists` flags checked locally. |

The displayed browser-plus-local-Node approach is approved. Use only APIs supported by the installed Node 24 runtime; generic documentation may show a newer release.

## Where It Runs and How Someone Tries It

The existing checker runs from this repository with `npm start`; open `http://127.0.0.1:8787/` in the user's Mac browser. The script is `node --env-file-if-exists=.env server.mjs`, loopback only. If the port is occupied, choose another explicit `PORT` without stopping unrelated apps. Current code implements the consultation/checker and all three observation modes. The primary preview intentionally remains disabled; fixture and fake-transport browser QA are explicitly offline.

The plan retains `disabled` by default, explicit `fixture` rehearsal and server-configured `live` mode. Fixtures must remain unmistakably simulated and cannot satisfy genuine API acceptance. Existing authorized key/units and a lawful informed-consent image remain separate prerequisites; no key is requested in chat or created here. Basics permits local app plus video/public repository; deployment is optional. No deployment or live call is authorized by this plan.

## Look and Feel

Preserve the implemented editorial direction in `prd.md > Look and Feel`: local serif display type, Avenir/Helvetica body fallback, warm ivory, charcoal, muted terracotta, flat source-transparent product comparison, visible focus and readable cautions. Adapt hierarchy to the consultation's short stages and separated summary, with one clear primary action per stage. The label reader becomes part of product considerations. No decorative AI/clinical badge, third-party font request, numerical fit score, account screen, or new framework.

## Components

### Browser Page and Lifecycle

`public/app.mjs` coordinates intake, care-check, optional observation and summary sections with Back/Continue/Clear. Render user/provider text using text APIs only. Keep context, care answers, sensitivities, selected image/object URL, operation IDs and results in memory; no URL encoding, cookies/storage, service worker persistence, or telemetry. Changing dependent inputs invalidates prior summary/eligibility and prevents stale async results from resurfacing. Revoke previews on replace/clear/page exit; retain honest provider-retention wording.

Implements `prd.md > Screens and Layout`, `Look and Feel`, and `States and Boundaries`.

### Consultation Rules and Source Content

`public/consultation.mjs` is pure: accept whitelisted context/care-answer enums, return branch, supported-track state, source/content identifiers, and reasons. Treat absent/invalid/contradictory values conservatively; retain any explicit emergency yes before unknown handling. No cosmetic score, commercial data, diagnosis, free-text interpretation, or unreviewed synonym inference enters the rules. Product policy follows the implementation record, not a claim of clinical triage validity.

`public/guidance.json` holds a content version, reviewed date, source URLs, bounded educational copy, and reviewed rule identifiers. Validate its schema/source references at load/test time. Missing/invalid content produces unavailable general guidance, never fabricated advice. Version control is the content-review mechanism; no automatic medical content ingestion. Extend the static allowlist only with the intended module/content.

Implements `prd.md > Consultation Intake and Care Routing`, `Educational Guidance and Product Considerations`, and `Acceptance Checks`.

### Frozen Catalog and Label Checker

`public/catalog.json` freezes exactly the two U.S. variants from [catalog evidence](catalog-evidence.md), with product ID, name, market, size, manufacturer URL, review date, manually verified ingredient array, and completeness/variant limitations. Treat `1,2-Hexanediol` as one ingredient and preserve source spelling; do not split labels blindly on commas.

`public/label-check.mjs` is a pure function shared with tests. Trim/collapse whitespace and compare case-insensitively without deleting punctuation or guessing synonyms. Known vocabulary is the reviewed catalog's exact names plus explicitly sourced aliases; start with no guessed aliases. Parse voluntary entries one per line. Unknown names remain unresolved rather than becoming positive no-overlap results.

Return overlaps, unresolved entries, source quality, and a status: label-only when no input; caution for documented overlap; insufficient information for incomplete/mismatched data or unresolved entries; qualified no-overlap only with reviewed complete information. Caution and uncertainty can coexist. Always retain tolerance/suitability limits. Cosmetic scores, prices, and sponsorship are absent from the function's inputs.

Implements `prd.md > Catalog and Label Check` and `Acceptance Checks`.

### Local Server and Request Policy

`server.mjs` binds only `127.0.0.1`; `lib/request-policy.mjs` handles bounds and safe responses. Serve an explicit asset allowlist, never `.env`, repository files, or arbitrary paths. Require the expected local Host/Origin for mutation requests, no cross-origin API allowance, and a current consent marker on analysis creation. Set no-store on API responses; log route category/status only, never bodies, filenames, keys, URLs, sensitivities, or task IDs.

App-chosen limits: raw JPEG/PNG body at most **8 MB (8,000,000 bytes)**, headers at most **8 KiB**, one active analysis, and at most **two new analyses per minute**. The byte cap follows the displayed approved 8 MB limit conservatively. Inspect bytes/signature instead of trusting declared MIME. Browser image decoding checks supported type and SD short side at least 480 pixels for user feedback; provider image/face validation remains authoritative. No user-supplied remote-image URL is accepted.

App routes: `GET /api/config` returns mode and configured boolean only; live-only `POST /api/analysis` accepts image bytes and returns `202 {operationId}`; `GET /api/analysis/:id` returns normalized progress/result; `DELETE /api/analysis/:id` forgets/aborts local work without promising provider cancellation/deletion. Fixture-only `GET /api/fixture-observation` returns the labeled synthetic scalar example; it is unavailable in other modes. Operations use unguessable IDs in RAM and expire after **10 minutes**. No sensitivity endpoint exists.

Implements `prd.md > Cosmetic Observation and Consent` and `States and Boundaries`.

### YouCam Adapter and Explicit Modes

`lib/youcam.mjs` alone reads the existing key and makes outbound requests. `disabled` returns unavailable. `fixture` exposes Show sample observation and a persistent **Fixture — no YouCam call** banner; it has no active photo picker/upload action, rejects image POSTs, and transmits no photo even to the local server. `live` requires configuration and explicit consent/action. Never fall back from a live error to fixture success. A live configured banner does not claim verified credentials/units until an actual successful run.

Use a 30-second upload timeout, 15-second task-create timeout, and 10-second status-request timeout. Poll no faster than once per 10 seconds, pause after 120 seconds, and permit checking the same known task until local expiry. Do not automatically repeat task creation after timeout or uncertain outcome; another chargeable task requires a new deliberate action. Release image buffers/references after upload or failure and keep signed URLs out of browser responses/logs. Do not promise physical memory erasure.

Implements `prd.md > Cosmetic Observation and Consent` and `Acceptance Checks`.

## Data Model

| Data | Location and lifetime |
| --- | --- |
| Reviewed two-product records/alias evidence | Versioned public static catalog; no personal data. Changes require source review and tests. |
| Context, care answers, voluntary sensitivities, summary/check result | Browser memory only; cleared on clear/reload. Never included in URLs, logs, YouCam/server requests. |
| Reviewed guidance/rule content | Versioned public static content with source/review date; no personal data. |
| Selected photo/preview | Browser memory/object URL; bytes temporarily pass through server RAM only after consent/action. No app disk persistence. |
| Local operation | RAM: opaque ID, timestamps, stage, provider task ID if known, next allowed poll, normalized scalar result/error; expires within 10 minutes or on clear. |
| Provider key | Existing authorized local environment/ignored `.env`, server only. Never serialized to client, fixtures, logs, Git, or evidence. |
| Provider-held data | Governed by provider terms; local clear/reload cannot delete it. Explain 24-hour result availability versus general 30-day retention before consent. |

## File Structure

Existing checker/server assets and tests are preserved. The consultation, provider/policy modules and focused tests now exist; fixture output is a fixed synthetic server response rather than a photo or standalone dataset:

```text
server.mjs                   # localhost server, asset/routes and ephemeral operations
lib/request-policy.mjs       # upload/origin/limit checks and safe errors
lib/youcam.mjs               # disabled/fixture/live adapter and normalization
public/index.html            # semantic page with consultation stages/summary
public/styles.css            # approved palette, responsive layout and focus states
public/app.mjs               # preserved checker orchestration/transient state
public/consultation.mjs      # pure answer routing and summary selection
public/consultation-ui.mjs   # staged browser UI, source rendering and reset
public/guidance.json         # source-reviewed educational content/rule identifiers
public/label-check.mjs       # pure documented-overlap/unknown logic
public/catalog.json          # exactly two reviewed source-frozen product records
test/label-check.test.mjs     # existing result limits, unknowns and independence invariants
test/consultation.test.mjs    # care/unknown/summary invariants
test/server.test.mjs         # request/privacy bounds with no external calls
test/youcam.test.mjs         # mocked contract, timeout and malformed response cases
package.json                 # start/test scripts, Node 24 engine; no runtime dependencies
.env.example                 # names only; no credential values
.gitignore                   # learner profile and credentials stay excluded
devpost/                     # approvals, implementation record and actual verification evidence
README.md                    # actual run/test/mode instructions and verified boundaries
```

## External Services and Dependencies

Only the live YouCam adapter contacts an API. Base `https://yce-api-01.makeupar.com`; API calls use Bearer authentication. [Official guide](https://docs.perfectcorp.com/reference/ai_skin_analysis), [file contract](https://docs.perfectcorp.com/_bundle/reference/file.json?download=), [skin contract](https://docs.perfectcorp.com/_bundle/reference/ai_skin_analysis.json?download=).

1. `POST /s2s/v2.0/file`: `files:[{content_type,file_name:"scan.jpg" or "scan.png",file_size}]`; validate `data.files[].file_id` and `requests[]` from the guide's response.
2. Send bytes using the returned signed request's method/URL/headers. Accept only HTTPS URLs from that authenticated initialization, never user URLs; do not follow arbitrary redirects or attach the API Bearer key to the signed upload.
3. `POST /s2s/v2.1/task/skin-analysis`: `{src_file_id,dst_actions:["texture"],format:"json"}`; validate `data.task_id`.
4. `GET /s2s/v2.1/task/skin-analysis/{task_id}`: validate `data.task_status` (`running`, `success`, `error`); on JSON success select the `texture` item by `type` in `data.results.output[]`, not array position. Normalize finite documented `raw_score`/`ui_score`; invalid/missing values mean unavailable. Discard mask URLs and unexpected fields. Never parse ZIP/category-map examples as this JSON schema.

The documented SD 1–4 concern tier costs **9 units**; one specifically authorized official-sample run consumed nine existing free units, with HTTP-200 balances 1,000 then 991 and $0 paid spending. Remaining entitlement/quota behavior is not generally established. Treat provider 429/quota/auth errors as unavailable with no auto-retry task. No paid resource or live call is authorized by this spec. The V2.0 file/V2.1 task pairing succeeded in the one authorized run recorded in [provider integration](provider-integration.md). Mock tests remain separate evidence; the sample does not prove general provider reliability. [Unit consumption](https://docs.perfectcorp.com/reference/ai_skin_analysis#unit-consumption), [API terms](https://www.makeupar.com/perfectbeauty/youcam/terms-of-service-api).

## Important Failure Modes

- **Care warning/unknown/unsupported concern:** exact proposed product branch is source-linked and takes precedence over scan/catalog output. Missing care answers never become no; no score can provide clearance.
- **Missing/stale guidance or malformed input:** honest unavailable/unknown information, not invented advice or a disease conclusion. Care warnings remain visible independently of content/scan errors.
- **Missing/rejected key, quota/rate limit or malformed provider output:** honest unavailable/error; no raw sensitive response or fixture substitution.
- **Slow/uncertain task or changed answers:** recover the same known task, no duplicate chargeable creation; discard stale local output. Clear stops local waiting, not necessarily provider processing.
- **Unknown sensitivity or incomplete/wrong label:** insufficient information retaining any caution, no guessed aliases, safe badge or suitability percentage.

## Verification Strategy

Preserve the existing 22 passing matcher/catalog/HTTP tests and prior browser evidence; those verify the checker checkpoint only. The 15 new pure-rule tests cover care/unknown/unsupported precedence, contradictions, score independence and repeated stateless evaluation; separate content-validation and actual browser checks cover source loading, edits, reset, focus and responsive behavior. See `consultation-delta.md > Verification Cases` and `verification.md`. Keep pure functions separate from DOM rendering so these checks test outcomes rather than mirroring markup.

Actual browser verification must exercise the complete revised ordinary/held/unknown journeys, scan skip/failure, clear/reload, keyboard focus and desktop/mobile layout; inspect network and logs for context leakage. Existing planned HTTP/provider tests still cover origin/consent/upload bounds, static-file/privacy exposure, mocked provider stages, malformed/auth/quota/timeout recovery, and no duplicate task creation. Only separately authorized access/units/image can establish one real upload → task → observation. Consultation/adapter/HTTP and offline browser checks have run as recorded in `provider-integration.md`; one specifically authorized real skin-analysis acceptance passed, as recorded in [provider integration](provider-integration.md). One documented free non-image cost request verified API-key acceptance with HTTP 200.

## What Was Simplified and Why

Keep the existing local single-process plain stack, two verified catalog records and pure label matcher. The approved journey adds bounded structured self-report and source-reviewed educational rules, not an open-ended medical chatbot, diagnosis engine, database, account/history, monetization or new analysis action. A small explicit rule set can be inspected and tested without claiming clinical validation. Fixtures remain development tools rather than evidence of the live kernel.

## Implementation Order Proposal

Affected remaining slices, preserving the approved order pattern: (1) usable source-backed consultation/summary around the preserved checker, with observation honestly disabled and early feedback; (2) the existing guarded adapter/consent/mode plan integrated with care holds and offline tests; (3) separately authorized real acceptance, final learner review and honest demo capture. Keep fast mode and do not mark learner review passed from agent QA. Exact slice fields are in `checklist.md`.

## Decisions and Open Issues

- **Settled:** approved consultation journey/dry-feeling-skin track; existing browser/Node/local runtime, editorial design, browser-only context/checking, server-only key, modes/limits, no duplicate chargeable task and fast mode.
- **Internal implementation record:** conservative care/unknown and educational/catalog rules plus affected remaining slices implement the approved journey; no duplicate stack/journey/fast-mode approval is needed.
- **Genuine technical uncertainty:** official file-response composition and real account/version behavior; check with offline contract tests then one separately authorized live run.
- **Live acceptance:** local configuration, free authentication preflight and one specifically authorized official-sample analysis are verified. Future images/analyses still require appropriate specific permission. No new credentials, personal image upload, paid spending or deployment implied.
- **Later shipping gates:** human-owned project name/fields/survey/reflections, publication/license decision, working demonstration and final hands-on confirmation.

## Prior Approval Record

The browser/local-Node stack, browser-only context/label checking, server-only key, consented photo boundary, request limits, polling/recovery, explicit modes and verification strategy were approved on October 26, 2026. Exact approval evidence is retained privately. That technical approval is not authorization for further images, units, publication or deployment.

## Consultation Revision Record

The consultation and dry-feeling-skin revision was approved on October 26, 2026. The existing stack/provider/privacy decisions were preserved; only affected same-stack modules, data, tests and slices changed. The consultation and adapter are implemented, offline verification passed and one specifically authorized official-sample live acceptance passed. Final learner retry/readiness and the wrap-up remain outstanding.
