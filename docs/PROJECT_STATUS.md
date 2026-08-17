# NUBO project status

## Active goal

- Product-owner QA the safe `nuboctl install` preparation flow, then bound systemd process controls and final activation separately from DB/bootstrap work.

## Recent completion

- Added `nuboctl install` preparation with mandatory release/Node/input checks, dry-run visibility, service identity and path creation, generated deployment settings and secrets, conflict-safe systemd/Nginx rendering, and idempotent reruns. It never overwrites an operator-owned file or activates/reloads a service, and it stops before all writes when the target domain is already present anywhere in the Nginx tree.
- Added a static Linux amd64 `nuboctl` to the integrated archive. Its read-only `doctor` and `status` commands diagnose the supported Ubuntu platform, runtime dependencies, exhaustive release integrity, environment permissions and required values, upload access, systemd/Nginx state, and HTTP health without mutating the server.
- Narrowed the official Ubuntu reverse proxy to Nginx, added the missing direct `/goapi/` route for OAuth/RSS, made both application listeners explicit loopback endpoints for new installs, and defined existing target-domain Nginx configuration as read-only to `nuboctl`.
- Added renderable systemd units plus an Nginx example to the integrated archive. Installation can substitute users, release/config/state paths, ports, the GOAPI path, Node, domain, body limit, and an existing upload root; GOAPI alone receives write access while the Nuxt release stays read-only.
- Made the upload filesystem root independently injectable through `NUBO_UPLOAD_DIR` while preserving the legacy `./upload` default, existing symlinks, and stable `/upload/...` DB/HTTP paths; upload path resolution rejects traversal outside the configured root.
- Added a minimal integrated release builder that packages the proven `.output`, an official Ubuntu 22.04 GOAPI build, the shared environment sample, independently versioned component provenance, and SHA-256 checksums; it extracts and verifies the archive on Ubuntu 24.04 and reruns the web artifact smoke suite without including secrets or mutable data.
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

- Split installation preparation from activation. The first `install` slice may create the service account, state/upload paths, a new external environment file, inactive systemd units, and an unenabled Nginx site; it must not fill DB/admin placeholders, run DB setup, call `daemon-reload`, enable/start units, enable/reload Nginx, or manage TLS.
- Treat an existing environment file as operator-owned: validate and preserve it. Treat rendered systemd/Nginx files as idempotent only while byte-identical; otherwise fail instead of overwriting. Scan the whole Nginx configuration tree for exact, wildcard, and common regex coverage of the requested domain before writing anything.
- Keep only the latest local release archive. A successful same-version build replaces the previous `dist/` output after verification; historical artifacts remain reproducible from Git commits and are not retained under ad-hoc backup names.
- Keep the first `nuboctl` binary self-contained and statically linked. `doctor` performs slower exhaustive release verification, while `status` favors operational checks and does not recalculate every checksum; both commands remain strictly read-only.
- Support Nginx as the only first-phase Ubuntu reverse proxy. On a clean target-domain configuration `nuboctl install` may render and validate a new site; if that domain is already configured or an installation is adopted, it must not edit or reload Nginx. Certbot and TLS lifecycle remain operator-owned.
- Treat systemd and reverse-proxy files as installer inputs with explicit `@TOKEN@` substitution, not as hard-coded units to copy blindly. Keep systemd as the first Ubuntu adapter and leave room for other service managers later.
- Treat `/var/lib/nubo/upload` as the Linux prebuilt default selected by the installer/service working directory, not a hard-coded product path. Operators may set `NUBO_UPLOAD_DIR` to an existing absolute directory such as `/var/www/<domain>/upload`.
- Keep the minimal archive limited to immutable application artifacts and metadata. Record the NUBO and GOAPI versions, commits, and dirty states independently; add service templates and `nuboctl` in later bounded slices.
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

- `nuboctl install`: Go unit/race/vet tests passed for actual preparation, rerun idempotency, dry-run immutability, operator-file conflicts, environment/domain validation, and exact/wildcard/regex Nginx ownership. An extracted integrated archive ran `nuboctl 0.2.0` under Node 26 in a clean container, created and then preserved all expected files, generated `0640` secrets/config, and passed `systemd-analyze verify` plus official `nginx -t`; the release builder and prebuilt web smoke suite also passed.
- `nuboctl`: unit tests, race tests, and `go vet ./...` passed. The static binary ran on Ubuntu 22.04/24.04; the integrated release rebuilt the official GOAPI binary, verified and extracted the archive on Ubuntu 24.04, passed the web smoke suite, and an extracted `doctor` run passed platform, manifest, target, and exhaustive checksum checks while correctly reporting absent server dependencies.
- Nginx and loopback boundary: GOAPI focused/full tests and `go vet ./...` passed; the legacy absent-host default remains `0.0.0.0` while the shared prebuilt sample selects `127.0.0.1`. The rendered Nginx template passed its official validator with separate Nuxt and GOAPI upstreams and forwarded headers.
- Linux service templates: focused ESLint and 2-file/3-test Vitest coverage passed; rendered units using an existing `/var/www/<domain>/upload` path passed `systemd-analyze verify`, and the rendered Nginx example passed its official configuration validator. The rebuilt integrated archive passed the official GOAPI Ubuntu 22.04/24.04 checks, checksum/manifest verification, and prebuilt web smoke suite and contained every service template. The tracked `goapi-linux` was replaced only through GOAPI's official Ubuntu 22.04 builder.
- Configurable upload root: focused config/utility/service/handler tests, full GOAPI tests, and `go vet ./...` passed; the shared environment sample regression confirms the legacy `./upload` default remains explicit.
- Integrated release bundle: the builder completed the required GOAPI Ubuntu 22.04 build and Ubuntu 22.04/24.04 runtime checks, verified checksums before and after archive transport, parsed the extracted manifest, confirmed secrets/mutable data/root dependencies were absent, and passed the prebuilt web smoke suite from the Ubuntu 24.04-extracted artifact.
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

- After product-owner QA, define systemd-backed `start`, `stop`, `restart`, and bounded journal viewing so activation can reuse tested controls. Keep GOAPI DB/bootstrap, Nginx enable/reload, readiness-driven completion, and first-admin guidance as explicit later installation slices.
