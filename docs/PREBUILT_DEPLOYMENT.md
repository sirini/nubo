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

The production server does not load the repository `.env` file automatically. Supply concrete
values through the process manager. For example, a dedicated web environment file can contain:

```dotenv
NITRO_HOST=127.0.0.1
NITRO_PORT=3000
NUXT_API_BASE_INTERNAL=http://127.0.0.1:3006/goapi
NUXT_PUBLIC_GOAPI_BASE=goapi
NUXT_PUBLIC_DOMAIN=https://example.com
NUXT_PUBLIC_TITLE=Example Community
NUXT_PUBLIC_VERSION=1.2.1
```

Start the artifact with a process manager `EnvironmentFile`, or directly on supported Node releases:

```bash
node --env-file=/etc/nubo/nubo-web.env /opt/nubo/current/web/.output/server/index.mjs
```

`NUXT_API_BASE_INTERNAL` is server-only and may use a loopback or private network address.
`NUXT_PUBLIC_GOAPI_BASE` is the public path used for browser-facing GOAPI routes such as OAuth and
RSS. Node's built-in `--env-file` does not expand `${OTHER_VARIABLE}` references, so its environment
file must contain final values as shown above.

## Upload ownership

The replaceable `.output/` artifact never owns user uploads. GOAPI writes them to persistent storage,
and Nginx or Caddy serves that directory at `/upload/`. A release replacement must therefore leave
the upload directory untouched. For the current single-host layout, the Nginx boundary remains:

```nginx
location /upload/ {
    alias /var/lib/nubo/upload/;
    autoindex off;
}
```

The final directory, service, reverse-proxy, manifest, checksum, and rollback contracts belong to
the later integrated release bundle and `nuboctl` work.
