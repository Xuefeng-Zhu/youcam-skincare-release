---
doc: consultation-journey
status: approved
feedback-date: 2026-10-26
approval-date: 2026-10-26
---

# Consultation-like skincare journey — approved flow

The consultation journey and dry-feeling-skin first track were approved on October 26, 2026. The app is a bounded skincare guide with evidence-separated self-report, cosmetic observation, educational guidance and label cautions; it does not claim to be a clinician or a clinically validated diagnostic service.

## Approved Journey

1. **Your concern.** Ask about the concern, recent changes, routine, and optional known sensitivities. Support dry-feeling skin first.
2. **Care first when needed.** Check self-reported warning signs that call for professional care, without diagnosis or photo-based symptom detection. Exact conservative questions, precedence and unknown handling are documented in the implementation record.
3. **A closer look, with consent.** Optionally add a real YouCam cosmetic observation with informed photo consent; missing/failed analysis stays honest. Provider processing/retention and access prerequisites remain separate.
4. **A useful, explainable summary.** Explain observations, practical educational skincare steps, and product considerations with reasons and uncertainty. Keep self-report, cosmetic evidence, guidance, and label evidence distinct. No diagnosis or prescriptions; the checker is a supporting component.

## First Release Versus Roadmap

**Approved journey boundary:** one cosmetic concern per session; short structured intake/follow-ups; limited care-routing rules; actual consented cosmetic API observation; a source-backed summary and small catalog component. Preserve the existing editorial design, tested label data/matcher, and plain browser/Node foundation. Use reviewed deterministic guidance first; an open-ended medical chatbot is not needed to make this journey useful.

**Later, if wanted:** additional concern tracks, larger maintained catalog, routine planning, accounts/history, clinician integration, and monetization. None is automatically authorized. Commercial incentives stay out of guidance/suitability logic.

## Core Tradeoffs and Dependencies

- A useful consultation needs more intake, evidence rules, uncertainty/error cases, and care-routing tests than the existing label page. No architecture replacement is assumed.
- One specifically authorized official-sample observation passed; [integration evidence](provider-integration.md) records that limited result. Any further analysis or image requires appropriate specific authorization. No new credentials, photo transfer, paid usage, deployment, or entry is authorized here.
- One supported non-emergency track is feasible to specify and test; promising a general “skin doctor” would exceed the evidence and current scope. No clinical diagnosis, prescription, disease exclusion, or automatic disease detection is proposed.
- Basics' earlier deadline competes with this material expansion. Keep actual implementation/evidence honest; do not promise completion or claim fixture results are live. The later YouCam deadline provides a separate submission window.

## Next Checkpoint

The consultation journey is implemented around the preserved checker/design. Do not repeat approval of the flow, first concern, stack, privacy or fast mode. [The implementation record](consultation-delta.md) describes source-backed details within that approval, and `verification.md` records actual checks. Actual early feedback was received and addressed. The remaining hands-on step is final learner retry/readiness. One specifically authorized official-sample live acceptance passed; future analyses/images are separately authorized.
