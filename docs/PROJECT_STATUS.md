# NUBO project status

## Active goal

- No active implementation; the next bounded roadmap or AI-foundation task will be selected with the product owner after govips production validation.

## Recent completion

- Moved the Community OS roadmap and shared project status into tracked `docs/` files.
- Defined the roadmap as an adaptable 5–10 year milestone map, not a mandatory implementation sequence.
- Assigned backup creation, transfer, retention, and recovery execution to server operators; NUBO documents data locations, compatibility, and pre-update checks instead of providing a backup engine.
- Added a staged scope for `nuboctl`, beginning with diagnostics rather than implementing the full command set at once.
- Made NUBO and GOAPI working agreements refer to the same portable project documents.

## Decisions

- Verify current product state and agree on a small, testable scope before implementing a large roadmap item; do not add abstractions or infrastructure merely because they appear in the roadmap.
- Keep Ubuntu 22.04 and its libvips 8.12 runtime supported because it remains a practical Cafe24 deployment target.
- Use govips v2.16 as the only image backend; it is the newest tested line that builds on Ubuntu 22.04.
- Continue using WebP for generated images; do not add AVIF output to the synchronous upload path.
- Treat an OpenAI key as AI capability availability, not automatic feature consent. Future AI work should start with a common service, per-feature admin controls, hard quotas/usage ledger, asynchronous image metadata, then selection translation and writing assistance.

## Verification

- Documentation paths, internal roadmap references, backup responsibility wording, and both repository working agreements reviewed with targeted searches and diffs.
- Previous image work: GOAPI `go test ./...`, `go vet ./...`, Ubuntu 22.04 release build and runtime checks; NUBO typecheck/build and targeted lint passed.

## Open findings

- Full NUBO ESLint still reports 358 pre-existing findings outside the imaging change.
- govips v2.17 advertises libvips 8.10+ but its generated `VipsTextWrap` binding does not compile against Ubuntu 22.04's libvips 8.12; keep v2.16 pinned while that deployment target remains.

## Next action

- After production validation of the govips change, compare the roadmap's highest-value bounded stabilization or community/media task with the previously discussed AI foundation, then agree on one scope before coding.
