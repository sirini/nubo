# NUBO project status

## Active goal

- Product-owner QA for the first `S0-Q02` frontend test-harness slice on `test/frontend-harness`.

## Recent completion

- Added separate Vitest projects for fast Node unit tests and Nuxt runtime tests, with reproducible `test`, `test:unit`, `test:nuxt`, and watch commands.
- Added initial regression coverage for content display utilities and every built-in skin manifest/default registration.
- Moved the Community OS roadmap and shared project status into tracked `docs/` files.
- Defined the roadmap as an adaptable 5–10 year milestone map, not a mandatory implementation sequence.
- Assigned backup creation, transfer, retention, and recovery execution to server operators; NUBO documents data locations, compatibility, and pre-update checks instead of providing a backup engine.
- Added a staged scope for `nuboctl`, beginning with diagnostics rather than implementing the full command set at once.
- Made NUBO and GOAPI working agreements refer to the same portable project documents.

## Decisions

- Build `S0-Q02` incrementally: unit/Nuxt harness first, Nitro authentication proxy tests next, then SSR/test DB and Playwright only when their fixtures are defined.
- Verify current product state and agree on a small, testable scope before implementing a large roadmap item; do not add abstractions or infrastructure merely because they appear in the roadmap.
- Keep Ubuntu 22.04 and its libvips 8.12 runtime supported because it remains a practical Cafe24 deployment target.
- Use govips v2.16 as the only image backend; it is the newest tested line that builds on Ubuntu 22.04.
- Continue using WebP for generated images; do not add AVIF output to the synchronous upload path.
- Treat an OpenAI key as AI capability availability, not automatic feature consent. Future AI work should start with a common service, per-feature admin controls, hard quotas/usage ledger, asynchronous image metadata, then selection translation and writing assistance.

## Verification

- Frontend test harness: clean `npm ci`, `npm test` (2 files, 4 tests), targeted ESLint, `npm run typecheck`, and `npm run build` passed.
- Documentation paths, internal roadmap references, backup responsibility wording, and both repository working agreements reviewed with targeted searches and diffs.
- Previous image work: GOAPI `go test ./...`, `go vet ./...`, Ubuntu 22.04 release build and runtime checks; NUBO typecheck/build and targeted lint passed.

## Open findings

- The current development shell uses Node 24.3, below Nuxt 4.5.2's supported Node 24 floor of 24.11; validation passes, but development and production runtimes should be upgraded before relying on this combination.
- The OpenAI image-description safety changes are pushed separately on `stabilize/ai-image-description` and await product-owner QA.
- Full NUBO ESLint still reports 358 pre-existing findings outside the imaging change.
- govips v2.17 advertises libvips 8.10+ but its generated `VipsTextWrap` binding does not compile against Ubuntu 22.04's libvips 8.12; keep v2.16 pinned while that deployment target remains.

## Next action

- QA the independent AI safety and frontend harness branches; after the harness merges, add focused Nitro refresh/cookie/body replay tests as the next `S0-Q02` slice.
