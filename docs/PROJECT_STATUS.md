# NUBO project status

## Active goal

- Build the next bounded `S2-Q02` slice: a minimal integrated NUBO/GOAPI release bundle with a manifest and checksums.

## Recent completion

- Defined one persistent runtime environment-file contract for both processes: GOAPI accepts `NUBO_ENV_FILE`, prebuilt Node uses `--env-file`, process values override file values, and legacy source installs still default to `.env`; the shared sample now uses concrete Nuxt values that require no variable expansion.
- Product-owner QA approved the `S2-Q01` prebuilt artifact/runtime boundary for merge to `main`.
- Proved that a clean Node 26 build's `.output` runs without source files or root `node_modules` on Node 24/26 and Ubuntu 22.04/24.04; added repeatable local/container smoke tests for runtime overrides, SSR, static assets, GOAPI proxying, multipart bodies, and external upload ownership.
- Added public `/health`, `/ready`, and `/version` endpoints to Nitro and GOAPI; readiness checks the real GOAPI/DB dependency chain while responses hide internal failure details.
- Audited post, comment, and attachment ownership checks and added focused GOAPI regressions for cross-board reads and mutations; no missing authorization guard was found in the reviewed paths.
- Changed OpenAI vision input to send the generated 512px small WebP thumbnail directly, without a second 256px resize or JPEG re-encode; retained `detail: low` and disabled reasoning.
- Added Nitro regression coverage for 401 refresh/retry, refreshed and backend cookies, binary request-body replay, missing refresh credentials, and concurrent refresh deduplication.
- Made the proxy utility's H3 and runtime-config dependencies explicit so the production module can be tested directly without changing request behavior.
- Merged the first `S0-Q02` frontend test harness: separate Vitest projects cover fast Node unit tests and Nuxt runtime tests, with initial coverage for content utilities and every built-in skin registration.
- Merged guarded OpenAI image descriptions: explicit opt-in defaults off, requests default to three images per post and one concurrent call, and token/failure logs make usage observable.
- Changed the default vision model to `gpt-5.6-luna`, fixed image data URL encoding, and disabled unnecessary reasoning.
- Moved the Community OS roadmap and shared project status into tracked `docs/` files and defined the roadmap as an adaptable 5–10 year milestone map.

## Decisions

- Keep one concrete environment file outside release directories and pass it explicitly to both processes. Paired GOAPI/Nuxt values remain duplicated in the file until a later installer generates them; do not depend on shell-style `${...}` expansion.
- Treat `.output` as the complete replaceable web artifact; keep source, root dependencies, configuration, and uploads outside it. Production must inject concrete `NUXT_API_BASE_INTERNAL` and matching `NUXT_PUBLIC_*` values through the process manager rather than rely on automatic `.env` loading or `${...}` expansion.
- Use the plain `/health`, `/ready`, and `/version` paths. The Kubernetes-style `z` suffix is only an ecosystem convention and adds no value to NUBO's own HTTP API.
- Treat status endpoints as the last small prerequisite for the prebuilt `.output` PoC; defer dashboard warnings, startup enforcement, and build-commit metadata to later release-manifest work.
- Test security invariants at the GOAPI authorization boundary, not every frontend path. Add DB-backed concurrency infrastructure only when an observed defect or risky database change requires it; do not optimize for broad coverage percentages.
- Keep the existing Nuxt `^4.5.2` dependency unchanged. Low-resource servers may receive a prebuilt `.output` from a higher-resource build machine rather than downgrading to the known-vulnerable 4.4.2 release.
- Build `S0-Q02` incrementally: unit/Nuxt harness first, Nitro authentication proxy tests next, then SSR/test DB and Playwright only when their fixtures are defined.
- Keep AI capabilities disabled by default and require a feature-specific switch in addition to server-side credentials. Common admin controls and a usage ledger belong to a later vertical AI feature slice.
- Use Node 26 through `nvm use 26` for frontend work and validation.
- Keep Ubuntu 22.04 and its libvips 8.12 runtime supported because it remains a practical Cafe24 deployment target.
- Use govips v2.16 as the only image backend and continue using WebP for generated images; do not add AVIF output to the synchronous upload path.
- Backup creation, transfer, retention, and recovery remain server-operator responsibilities; NUBO documents data locations and compatibility rather than providing a backup engine.

## Verification

- Shared runtime configuration: GOAPI focused config tests, `go test ./...`, and `go vet ./...` passed; the official Ubuntu 22.04 build completed, passed its Ubuntu 22.04/24.04 runtime checks, and the bundled binary loaded an external `NUBO_ENV_FILE` through database initialization. NUBO targeted ESLint, `npm test` (4 files, 8 tests), typecheck, production build, local prebuilt smoke, and Ubuntu 22.04/24.04 prebuilt smoke passed on Node 26.7.0.
- Prebuilt PoC: clean source snapshot `npm ci`, `npm test` (3 files, 7 tests), `npm run typecheck`, and `npm run build` passed on Node 26.7.0; focused ESLint and `git diff --check` passed. The isolated-artifact smoke suite passed on local Node 26.7.0 and Node 24.3.0 and in clean Ubuntu 22.04/24.04 containers with Node's `libatomic1` runtime dependency installed. Full lint remains at the known baseline of 358 findings (221 errors, 137 warnings).
- Status endpoints: GOAPI focused tests, `go test ./...`, `go vet ./...`, Ubuntu 22.04/24.04 binary checks; NUBO targeted ESLint, 3-file/7-test Vitest suite, typecheck, production build, and built-server HTTP smoke passed on Node 26.7.0.
- Core resource authorization: focused GOAPI service tests, service race tests, `go test ./...`, and `go vet ./...` passed; authenticated handlers overwrite client-supplied user IDs with the JWT identity.
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

- Define the minimal release manifest and archive boundary, then assemble the proven `.output`, an official Ubuntu 22.04 GOAPI build, the shared environment sample, and checksums without including secrets or mutable data.
