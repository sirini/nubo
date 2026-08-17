# NUBO project status

## Active goal

- Product-owner QA for the Nitro authentication proxy regression slice on `test/nitro-auth-proxy`.

## Recent completion

- Added Nitro regression coverage for 401 refresh/retry, refreshed and backend cookies, binary request-body replay, missing refresh credentials, and concurrent refresh deduplication.
- Made the proxy utility's H3 and runtime-config dependencies explicit so the production module can be tested directly without changing request behavior.
- Merged the first `S0-Q02` frontend test harness: separate Vitest projects cover fast Node unit tests and Nuxt runtime tests, with initial coverage for content utilities and every built-in skin registration.
- Merged guarded OpenAI image descriptions: explicit opt-in defaults off, requests default to three images per post and one concurrent call, and token/failure logs make usage observable.
- Changed the default vision model to `gpt-5.6-luna`, fixed JPEG data URL encoding, disabled unnecessary reasoning, and fixed the pre-Base64 vision input at 256px with JPEG quality 60.
- Moved the Community OS roadmap and shared project status into tracked `docs/` files and defined the roadmap as an adaptable 5–10 year milestone map.

## Decisions

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

- Full NUBO ESLint still reports 358 pre-existing findings outside the completed work.
- govips v2.17 advertises libvips 8.10+ but its generated `VipsTextWrap` binding does not compile against Ubuntu 22.04's libvips 8.12; keep v2.16 pinned while that deployment target remains.
- Live OpenAI response quality, latency, and billing remain part of product-owner server QA because automated tests do not spend API credits.

## Next action

- Product-owner QA of `test/nitro-auth-proxy`; merge it into `main` only after approval, then choose the next bounded stabilization slice.
