---
doc: scope
status: approved
prior-status: approved
revision-date: 2026-10-26
approval-date: 2026-10-26
prior-approval-date: 2026-10-26
---

# Skincare Guide — Consultation Scope Revision

A guided, consultation-like skincare experience that helps someone organize a cosmetic concern, understand the limits of a genuine skin observation, and consider sensible next steps and documented product information.

**Consultation journey and dry-feeling-skin focus approved October 26, 2026.** This replaces the earlier checker-first kernel while preserving the verified checker and editorial design. [The implementation record](consultation-delta.md) records conservative rules within the approved flow. The consultation, guarded adapter and one specifically authorized real provider acceptance now work; final learner retry/readiness remains incomplete. Earlier decisions are retained as history, not new permissions.

## The Unique Kernel

A short guided consultation that brings together **what the person reports**, **what a cosmetic API observes**, and **what product-label evidence supports**, without merging them into an invented clinical conclusion. The label checker becomes one supporting tool within the outcome, rather than the whole experience.

## Who It's For

Approved first-release focus: an adult with a non-emergency cosmetic skincare concern who wants understandable guidance and product considerations. Start with one concern per session. The learner selected dry-feeling skin as the first track by approving the displayed recommendation. Known sensitivity information stays voluntary, and the app does not claim to assess every skin issue.

## The Core Loop

1. **Tell us what is happening.** Voluntarily give the main concern, duration/recent changes, current basic routine, and known sensitivities. Short relevant follow-ups clarify context; no account or stored history is assumed.
2. **Know when to seek care.** An explicit, limited self-report question may route urgent or concerning symptoms to professional care before photo analysis or product suggestions. The app does not detect symptoms from a photo, diagnose an emergency, or treat unanswered questions as an all-clear.
3. **Add a genuine cosmetic observation.** With explicit permission and informed photo consent, run a documented YouCam analysis. Explain it as cosmetic evidence with limits; declining or unavailable analysis stays visible, with no made-up result.
4. **Understand the next step.** Present separate sections: what was reported; cosmetic observation; source-backed educational guidance; product options/label cautions with reasons and uncertainty; and when to seek professional care. Score, symptom report, and label match never establish product tolerance or clinical certainty.

This approves a bounded consultation experience, not unsupported medical reasoning. See [the approved journey and exact approval extent](consultation-journey.md).

## Inspiration & Identity

Chosen references: [YouCam hackathon](https://youcam-api-skin-ai-ecommerce.devpost.com/), [Build With AI: Basics](https://learn-ai-basics.devpost.com/), and [Devpost Learn](https://github.com/challengepost/learn-ai-basics). Preserve the implemented editorial visual direction requested in the learner’s design feedback; adapt its hierarchy to the proposed consultation journey.

## Why This Matters to the Learner

The learner wants help avoiding or mitigating skin issues, checking product fit, and recommending products as a possible monetization strategy. These motivations do not establish prevention or treatment claims.

## What "Working" Looks Like

A person can complete the short context-to-guidance journey, see a real consented cosmetic observation when authorized, understand why an educational/product option is shown or withheld, and follow an explicit professional-care route when relevant. Missing information produces uncertainty rather than reassurance. Existing label cases remain correct. No account/history, fake analysis, numerical compatibility, diagnosis, or prescription is necessary to demonstrate the first release.

## The POC Boundary

Approved boundary: one non-emergency concern track, a small guided intake, limited source-reviewed self-report care routing, one genuine YouCam observation flow, an evidence-separated summary, and a small verified category catalog using the existing checker. Keep routine/symptom/sensitivity answers in browser memory and out of provider requests. Do not assume a new AI-chat service, database, native app, or architecture rewrite.

One specifically authorized official-sample analysis is verified in [provider integration](provider-integration.md); future images and additional analyses remain separately authorized. Product recommendations require evidence beyond a cosmetic score or missing allergen overlap. No credential, API/photo transmission, spending, deployment, or submission is authorized by this scope feedback.

## Later

The learner's broader goals remain: help avoid or mitigate issues, recommend products, and explore monetization. The approved journey brings in modest source-backed educational guidance and explainable catalog considerations. Later scope may extend concern coverage, personalized recommendations where evidence permits, routine planning, and catalog automation. No prevention, treatment, or tolerance claim is established. Affiliate revenue is an agent suggestion; sponsorship or commission must never affect label checks or suitability reasoning.

## Explicitly Cut

Exclusions for this proof of concept:

- Guaranteed prevention/tolerance, photo diagnosis, or medication/treatment selection: beyond the proposed cosmetic-guidance boundary.
- Marketplace, checkout, purchases, affiliate enrollment, and live commercial links: unnecessary for this demonstration and unauthorized.
- Multiple native apps and full account/sync infrastructure: expand the experiment without proving its kernel.
- Undocumented claims of YouCam ingredient matching or clinical scoring: provider analysis and product reasoning must remain distinct.

## Prior Approval Record

The earlier checker-first core was approved on October 26, 2026. It is retained as historical context and was superseded by the consultation journey approved the same day. Exact approval evidence is retained privately. No past approval grants new image, spending, publication or submission permission.

## Revision Review

The consultation flow and dry-feeling-skin focus were approved on October 26, 2026: concern/recent changes/routine/known sensitivities, explicit warning-sign care routes, optional consented cosmetic observation and evidence-separated practical guidance/product considerations. Diagnosis and prescriptions remain excluded. The [implementation record](consultation-delta.md) documents affected details. Final learner retry/readiness is still pending; no duplicate planning approval is needed.
