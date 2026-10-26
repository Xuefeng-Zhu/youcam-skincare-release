# Skinny

Technical setup and verification.

This clean release tree contains the local browser/Node application, approved technical plans, source attributions and factual verification evidence. Original application code is licensed under [MIT](LICENSE). Skinny is the learner-selected project name. This page contains technical documentation, not learner-authored submission answers.

## Run locally

Use **Node 24**. There are no runtime dependencies to install.

```sh
YOUCAM_MODE=disabled npm start
```

Open `http://127.0.0.1:8787/`. The server binds only loopback. If occupied, select another explicit `PORT` without stopping an unrelated process. Disabled mode accepts no photos; the consultation and product-label checker work without provider access.

```sh
npm test
```

The offline suite has 96 tests: 15 consultation rules, 16 catalog/matcher, 16 HTTP/privacy and 49 adapter tests. Tests use local fake/stubbed provider transport, not real YouCam calls. No key is needed for tests.

## Application modes and boundaries

- `YOUCAM_MODE=disabled`: no photo analysis; no provider call.
- `YOUCAM_MODE=fixture PORT=8788 npm start`: visibly simulated observation with no photo picker or upload. Stop the test process when finished.
- Live mode requires an existing authorized key configured only on the server in ignored local environment configuration, plus appropriate permission for the image and analysis. `.env.example` contains names/defaults only. Never commit a key or put it in `public/`.

Startup makes no provider request. Live analysis requires a supported consultation path, valid JPEG/PNG up to 8,000,000 bytes, explicit processing consent and a deliberate Analyze action. Limits include one active operation, bounded polling and no automatic duplicate chargeable task. These rate limits are request safeguards, not a billing or unit-spending ceiling; each new deliberate live analysis can consume units. Local clear/reload cannot cancel provider processing or delete provider-held data. Local rate limits are not a hard billing ceiling; only the recorded authorized run is verified as nine free units and $0 paid spending.

The first track is dry-feeling skin. Structured care answers can hold scan/product output; unknown answers never establish clearance. Label overlap is a caution, unknown/incomplete data remains insufficient, and no overlap never establishes tolerance or suitability. The app does not diagnose, prescribe, infer sensitivities from images, or make clinical-validation claims. Context/sensitivities remain in browser memory; only a specifically consented image passes through the local server for live analysis.

## Plans, sources and evidence

- [Approved scope](devpost/scope.md), [PRD](devpost/prd.md), [technical spec](devpost/spec.md) and [build checklist](devpost/checklist.md)
- [Offline application map](devpost/app-map.html), source-checked and browser-rendered alongside the project-grounded recap
- [Consultation journey](devpost/consultation-journey.md) and [source-reviewed implementation rules](devpost/consultation-delta.md)
- [Product evidence](devpost/product-evidence.md) and [two exact catalog snapshots](devpost/catalog-evidence.md)
- [Verification results and limits](devpost/verification.md) and [one real provider acceptance](devpost/provider-integration.md)
- [Release file hashes](RELEASE-MANIFEST.json)

One specifically authorized official provider-sample analysis returned cosmetic texture uiScore 74, using nine existing free units and $0 paid spending. That limited result is separate from offline simulation and is not clinical validation or blanket permission to repeat analyses. No provider image, private footage, credential, account/task identifier or personal input is included here.

The learner confirmed the current app ready after the walkthrough, and a brief code-map recap connected their feedback to the separation of label checks, cosmetic observation and care warnings. The full-frame narrated video is complete and verified; public-video access and formal submission are tracked separately, and no submitted entry is claimed here. The release omits the private recording/Remotion toolchain and all development history. Publication of this code does not complete learner review or a Devpost submission.

## Sources and rights

Manufacturer and FDA/AAD/NHS links are source attributions and guidance, not shopping controls. Exact label snapshots are dated and may differ from a physical package. Manufacturer names/content and provider materials retain their respective rights; the MIT notice does not claim new rights to third-party material. No provider sample image is redistributed.

Development credentials, learner profile, conversation references, private notes, output/captures, video tooling and the development `.git` history are excluded from this tree. The original private development repository remains separate and unchanged by release preparation.
