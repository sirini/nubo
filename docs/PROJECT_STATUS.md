# NUBO project status

## Active goal

- Complete the approved Nitro authentication regression and direct 512px vision-thumbnail work, then continue security-first stabilization from `main`.

## Recent completion

- Changed OpenAI vision input to send the generated 512px small WebP thumbnail directly, without a second 256px resize or JPEG re-encode; retained `detail: low` and disabled reasoning.
- Added Nitro regression coverage for 401 refresh/retry, refreshed and backend cookies, binary request-body replay, missing refresh credentials, and concurrent refresh deduplication.
- Made the proxy utility's H3 and runtime-config dependencies explicit so the production module can be tested directly without changing request behavior.
- Merged the first `S0-Q02` frontend test harness: separate Vitest projects cover fast Node unit tests and Nuxt runtime tests, with initial coverage for content utilities and every built-in skin registration.
- Merged guarded OpenAI image descriptions: explicit opt-in defaults off, requests default to three images per post and one concurrent call, and token/failure logs make usage observable.
- Changed the default vision model to `gpt-5.6-luna`, fixed image data URL encoding, and disabled unnecessary reasoning.
- Moved the Community OS roadmap and shared project status into tracked `docs/` files and defined the roadmap as an adaptable 5–10 year milestone map.

## Decisions

- Keep the existing Nuxt `^4.5.2` dependency unchanged. Low-resource servers may receive a prebuilt `.output` from a higher-resource build machine rather than downgrading to the known-vulnerable 4.4.2 release.
- Build `S0-Q02` incrementally: unit/Nuxt harness first, Nitro authentication proxy tests next, then SSR/test DB and Playwright only when their fixtures are defined.
- Keep AI capabilities disabled by default and require a feature-specific switch in addition to server-side credentials. Common admin controls and a usage ledger belong to a later vertical AI feature slice.
- Use Node 26 through `nvm use 26` for frontend work and validation.
- Keep Ubuntu 22.04 and its libvips 8.12 runtime supported because it remains a practical Cafe24 deployment target.
- Use govips v2.16 as the only image backend and continue using WebP for generated images; do not add AVIF output to the synchronous upload path.
- Backup creation, transfer, retention, and recovery remain server-operator responsibilities; NUBO documents data locations and compatibility rather than providing a backup engine.

## Verification

- Nitro proxy slice on Node 26.7.0: targeted ESLint, `npm test` (3 files, 7 tests), `npm run typecheck`, and `npm run build` passed.
- AI image descriptions: GOAPI `go test ./...`, `go vet ./...`, focused race tests, and the Ubuntu 22.04 release build passed; NUBO typecheck/build passed on Node 26.7.0.
- Frontend test harness: clean `npm ci`, `npm test` (2 files, 4 tests), targeted ESLint, `npm run typecheck`, and `npm run build` passed.
- Previous image work: GOAPI `go test ./...`, `go vet ./...`, Ubuntu 22.04 release build and runtime checks; NUBO typecheck/build and targeted lint passed.

## Open findings

- Nuxt 4.5's Vite 8 build can exceed the resources available on some deployment servers. Off-host builds are the current operational workaround; Rspack compatibility can be evaluated separately if this becomes a recurring maintenance burden.
- Full NUBO ESLint still reports 358 pre-existing findings outside the completed work.
- govips v2.17 advertises libvips 8.10+ but its generated `VipsTextWrap` binding does not compile against Ubuntu 22.04's libvips 8.12; keep v2.16 pinned while that deployment target remains.
- Live OpenAI response quality, latency, and billing remain part of product-owner server QA because automated tests do not spend API credits.

## Next action

- Continue the next agreed roadmap stabilization slice from the updated `main` branches while product-owner server QA covers live OpenAI behavior and deployment-specific regressions.
