# Prebuilt Nuxt deployment PoC

This document defines the artifact and runtime boundary proven by `S2-Q01`. It is not yet the
combined NUBO/GOAPI release bundle planned for `S2-Q02`.

## Artifact boundary

Build NUBO on a machine with enough memory, using the project-standard Node 26 toolchain:

```bash
nvm use 26
npm ci
npm test
npm run typecheck
npm run build
npm run test:prebuilt
npm run test:prebuilt:ubuntu
```

Only `.output/` is required on the web runtime host. The source tree, root `package.json`, and root
`node_modules/` are build inputs and must not be copied. `.output/server/node_modules/` is different:
Nitro creates it as part of the self-contained server artifact and it must remain in place.

The smoke test copies `.output/` into a new temporary deployment directory, starts it with the same
Node executable running the test, and verifies:

- private and public configuration supplied after the build;
- `/health`, `/ready`, and `/version`;
- server-rendered HTML and a referenced `/_nuxt/` asset;
- a representative GOAPI request and multipart upload request;
- the absence of mutable upload data from the release artifact.

`test:prebuilt:ubuntu` runs the same smoke suite in clean Ubuntu 22.04 and 24.04 containers. It
mounts the active Node installation and installs `libatomic1`, a dependency that a normal packaged
Node installation provides but a bare Node binary copied into a minimal Ubuntu image does not.

## Runtime configuration

The production web server does not load a `.env` file automatically. GOAPI loads `.env` from its
working directory by default, or the explicit path supplied through `NUBO_ENV_FILE`. A prebuilt
installation can therefore keep one persistent file such as `/etc/nubo/nubo.env` outside every
release and give that same file to both processes.

The shared file contains concrete GOAPI and Nuxt values. Its web-facing portion looks like:

```dotenv
GOAPI_HOST=127.0.0.1
GOAPI_PORT=3006
NITRO_HOST=127.0.0.1
NITRO_PORT=3000
NUXT_APP_BASE_URL=/
NUXT_API_BASE_INTERNAL=http://127.0.0.1:3006/goapi
NUXT_PUBLIC_GOAPI_BASE=goapi
NUXT_PUBLIC_DOMAIN=https://example.com
NUXT_PUBLIC_TITLE=Example Community
NUXT_PUBLIC_VERSION=1.2.25
```

Point GOAPI at the file and pass the same file to Node:

```bash
NUBO_ENV_FILE=/etc/nubo/nubo.env /opt/nubo/current/bin/goapi
node --env-file=/etc/nubo/nubo.env /opt/nubo/current/web/.output/server/index.mjs
```

`NUXT_API_BASE_INTERNAL` is server-only and may use a loopback or private network address.
`NUXT_PUBLIC_GOAPI_BASE` is the public path used for browser-facing GOAPI routes such as OAuth and
RSS. Node's built-in `--env-file` does not expand `${OTHER_VARIABLE}` references, so its environment
file must contain final values as shown above.

For a subpath deployment, set `NUXT_APP_BASE_URL=/sample/`. Nuxt routes and built assets then live
below `/sample/`, and NUBO derives its same-origin browser proxy as `/sample/api` unless an explicit
`NUXT_PUBLIC_API_BASE` overrides it. The reverse proxy must preserve that prefix when forwarding to
Nitro. Direct GOAPI paths such as OAuth and RSS remain governed by `NUXT_PUBLIC_GOAPI_BASE` and the
site's reverse-proxy configuration.

Existing source installations require no change: without `NUBO_ENV_FILE`, GOAPI continues to use
`.env` in its working directory. Values already present in the GOAPI process environment override
values read from the file. When changing a shared setting such as the public domain, title, version,
GOAPI path, port, size limit, or token lifetime, keep its `GOAPI_*`/`JWT_*` and `NUXT_*` entries in
sync. The interactive installer and its non-interactive input file generate these paired concrete values.

`NUBO_UPLOAD_DIR` independently selects the mutable upload root. Its default remains `./upload`, so
source installs and existing upload symlinks keep working. A prebuilt install normally sets it to
`/var/lib/nubo/upload`, while an existing site can point directly to a path such as
`/var/www/example.org/upload`. Stored database and public HTTP paths remain `/upload/...` regardless
of the filesystem location.

## Upload ownership

The replaceable `.output/` artifact never owns user uploads. GOAPI writes them to persistent storage,
and Nginx serves that directory at `/upload/`. A release replacement must therefore leave
the upload directory untouched. For the current single-host layout, the Nginx boundary remains:

```nginx
location /upload/ {
    alias /var/lib/nubo/upload/;
    autoindex off;
}
```

Versioned bundles live in immutable `/opt/nubo/releases/<version>` directories. Services refer only to
the `/opt/nubo/current` symlink, while configuration, state, and uploads remain outside every release. Before a
successful transition changes `current`, nuboctl records its target in `/opt/nubo/previous`. Manual release pruning
protects both links, the official base of the active site build, and one additional newest fallback. It only removes
unprotected directories that still pass the complete manifest, required-file, and checksum validation.

## Linux service templates

The integrated bundle contains renderable templates under `share/systemd` and `share/nginx`. Their
`@TOKEN@` values let the installer keep the standard `/opt/nubo`, `/etc/nubo`, and `/var/lib/nubo`
layout or adopt an existing absolute upload directory. The GOAPI unit is the only application process
granted write access to that directory; the web unit treats the release as read-only, and Nginx serves
the same directory at `/upload/`. Nginx sends `/` to Nuxt on port 3000 and `/goapi/` directly to the
loopback-only GOAPI listener on port 3006. Browser application calls under `/api/` still pass through
Nuxt so its authentication refresh and cookie handling remain active; direct `/goapi/` access supports
OAuth and RSS routes.

Nginx and TLS are fully operator-owned. `nuboctl install` does not read, create, modify, link, validate,
enable, disable, or reload files under `/etc/nginx`; read-only diagnostics and the bundled configuration
example remain available. The installer renders only the systemd templates, points those units at `current`,
and starts the application services after database preparation. Human operators use its Korean interactive
flow; AI and automation follow the release-root `INSTALL_GUIDE_FOR_AI.md` and explicit non-interactive options.

New installs expose `nubo.service` as the operator-facing lifecycle unit while retaining `nubo.target`
as the internal GOAPI/Web grouping. Operators can therefore run `systemctl restart nubo`, and may still
restart `nubo-goapi` or `nubo-web` independently when needed. Each application service receives a
`nubo-lifecycle.conf` drop-in with `PartOf=nubo.service`; this direct relationship is required because
`PropagatesStopTo=` alone does not propagate a restart of the oneshot facade.

An installation adopted before the facade was introduced receives the additive application-service
drop-ins during an update, but the update does not install the missing facade itself. After updating to a
release that contains `share/systemd/nubo.service`, its operator may opt in manually without restarting the
running application. Reinstalling identical drop-ins is idempotent:

```bash
sudo install -m 0644 /opt/nubo/current/share/systemd/nubo.service /etc/systemd/system/nubo.service
sudo install -d -m 0755 /etc/systemd/system/nubo-goapi.service.d /etc/systemd/system/nubo-web.service.d
sudo install -m 0644 /opt/nubo/current/share/systemd/nubo-lifecycle.conf /etc/systemd/system/nubo-goapi.service.d/nubo-lifecycle.conf
sudo install -m 0644 /opt/nubo/current/share/systemd/nubo-lifecycle.conf /etc/systemd/system/nubo-web.service.d/nubo-lifecycle.conf
sudo systemctl daemon-reload
sudo systemctl disable nubo.target
sudo systemctl enable --now nubo.service
```

Afterward, `sudo systemctl restart nubo` directly restarts both application services through their `PartOf=`
relationship. Updates that contain the lifecycle drop-in add it automatically when no conflicting operator
file exists, without replacing the rendered base units.
The old target remains installed for compatibility and should not be deleted.

The update boundary intentionally starts with an operator-staged release and a confirmed external backup.
After checksum and compatibility validation, `nuboctl` runs only additive database migrations, atomically
updates the two runtime version values, switches `current`, restarts the services, and checks readiness. A
readiness failure restores the previous environment, link, and processes, but does not reverse database
migrations; every migration must therefore remain compatible with the immediately previous release.
The public `nuboctl update` command first protects official local changes and runs `git pull --ff-only`, then
downloads, verifies, extracts, and stages the configured release. A previously applied site build is rebuilt for
the candidate before the service transition and applied automatically afterwards. The internal `--release`
boundary still starts at a staged release. It asks for an external backup and runs additive database setup only
when the pinned GOAPI commit changes. Both releases must carry identical systemd and Nginx templates because the
update does not rewrite live service configuration during a release transition.

## Minimal integrated bundle

After `npm run build`, the current `S2-Q02` assembly PoC can be run with:

```bash
npm run build:release
```

It rebuilds GOAPI through its required Ubuntu 22.04 build script, records both repository commits in
`manifest.json`, generates SHA-256 checksums, creates `dist/nubo-<version>-linux-amd64.tar.gz` plus a
`.sha256` sidecar, and
extracts it again on Ubuntu 24.04 before running the prebuilt web smoke suite. A dirty source state is
recorded in the manifest so a development artifact cannot be mistaken for a clean official release.
The verified output replaces an existing archive with the same version, so `dist/` only needs the
latest bundle rather than manually named intermediate backups.
The bundle intentionally excludes secrets, uploads, root dependencies, and rendered service files.
It includes x86-64 baseline and x86-64-v2 sharp-libvips variants under `lib/`, with provenance and
license records under `licenses/sharp-libvips/`. glibc selects the compatible variant automatically,
so runtime servers do not install a system libvips package. It also includes the static Linux `nuboctl` binary
with safe `install`, source-coordinated `update` and `customize` flows, read-only `doctor` and `status`,
explicit `releases list/prune` management commands, and the unprivileged service and proxy templates used by the installer.

The official archive is attached to an immutable GitHub Release. `deploy/release-sources.json` pins the GOAPI
commit used by both local and CI release builds and selects the release or prerelease tag consumed by source
checkouts. `server:prepare`, `server:install`, and the official portion of public `nuboctl update` all reuse this
single archive. Only installations that previously registered a local site customization run the required
dependency preparation, typecheck, and Web build during update.
