# NUBO project status

## Active goal

- Product-owner QA for the OpenAI image-description safety branch; no new AI feature is being added in this work unit.

## Recent completion

- Stabilized the existing image-description path: an API key no longer implies consent, explicit opt-in defaults off, requests default to three images per post and one concurrent call, low-detail vision input and a 300-token output ceiling bound cost, and logs expose failures plus token usage.
- Kept `gpt-4o-mini` as the default after the current official OpenAI model documentation confirmed that it remains active and supports image input; made the model configurable for future migrations.
- Moved the Community OS roadmap and shared project status into tracked `docs/` files.
- Defined the roadmap as an adaptable 5–10 year milestone map, not a mandatory implementation sequence.
- Assigned backup creation, transfer, retention, and recovery execution to server operators; NUBO documents data locations, compatibility, and pre-update checks instead of providing a backup engine.
- Added a staged scope for `nuboctl`, beginning with diagnostics rather than implementing the full command set at once.
- Made NUBO and GOAPI working agreements refer to the same portable project documents.

## Decisions

- Keep AI capabilities disabled by default and require a feature-specific switch in addition to server-side credentials. Environment limits are the first safety layer; common admin controls and a usage ledger belong to a later vertical AI feature slice.
- Verify current product state and agree on a small, testable scope before implementing a large roadmap item; do not add abstractions or infrastructure merely because they appear in the roadmap.
- Keep Ubuntu 22.04 and its libvips 8.12 runtime supported because it remains a practical Cafe24 deployment target.
- Use govips v2.16 as the only image backend; it is the newest tested line that builds on Ubuntu 22.04.
- Continue using WebP for generated images; do not add AVIF output to the synchronous upload path.
- Treat an OpenAI key as AI capability availability, not automatic feature consent. Future AI work should start with a common service, per-feature admin controls, hard quotas/usage ledger, asynchronous image metadata, then selection translation and writing assistance.

## Verification

- AI image-description safety: GOAPI `go test ./...`, `go vet ./...`, focused configuration/service race tests, and `./scripts/build-ubuntu22.sh` passed; the bundled Linux binary passed Ubuntu 22.04 glibc/libvips checks and Ubuntu 24.04 runtime link checks.
- Documentation paths, internal roadmap references, backup responsibility wording, and both repository working agreements reviewed with targeted searches and diffs.
- Previous image work: GOAPI `go test ./...`, `go vet ./...`, Ubuntu 22.04 release build and runtime checks; NUBO typecheck/build and targeted lint passed.

## Open findings

- Full NUBO ESLint still reports 358 pre-existing findings outside the imaging change.
- govips v2.17 advertises libvips 8.10+ but its generated `VipsTextWrap` binding does not compile against Ubuntu 22.04's libvips 8.12; keep v2.16 pinned while that deployment target remains.

## Next action

- Complete and product-owner QA the image-description safety branch, then begin the first bounded `S0-Q02` frontend test-harness slice.
