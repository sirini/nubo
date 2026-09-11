# SSR memory incident — 2026-09-11

Sensta's Node process aborted after about 89 hours with `JavaScript heap out of memory`.
The final major GC reclaimed only about 10 MiB, leaving 1,465.5 MiB live. The deployed Node
24.14.1 command omitted `NODE_ENV=production`.

## Confirmed reproduction

The existing production build was tested locally on Node 26.8.1 with synthetic GOAPI
responses. Requests ran sequentially and measurements followed explicit GC:

| Runtime environment | Requests | Heap after 100 requests | Heap after 1,000 requests |
| --- | --- | --- | --- |
| `NODE_ENV` unset | Login SSR | 81 MiB | 447 MiB |
| `NODE_ENV=production` | Login SSR | 40 MiB | 38 MiB |
| `NODE_ENV` unset | Distinct nonexistent paths | ~21 MiB | 21 MiB |

A separate 300-login heap snapshot retained Vue instances through
`vee-validate → DEVTOOLS_FORMS → form._vm → component scope`. Its development registry
registers each form and relies on `onUnmounted` for removal; SSR does not run that hook.
This matches [vee-validate issue #4963](https://github.com/logaretm/vee-validate/issues/4963).
Nuxt also documents [setting production mode when starting Node](https://nuxt.com/docs/4.x/directory-structure/env).

The production process had the same library implementation and no `NODE_ENV`. This is
the strongest evidenced cause of the incident; no heap snapshot from the crashed process
exists, so other contributors cannot be excluded. PHP scan traffic was visible in logs,
but the 404 reproduction did not show the growing heap.

## Correction and operation

Sensta's `.env` now includes `NODE_ENV=production`, and its existing tmux Node process
was restarted with an explicit production environment. The previous `.env` is backed up
at `/var/backups/sensta-node-20260911-225153/env` with mode 0600. Internal home, login,
health and readiness, plus public home and login returned HTTP 200. GOAPI and the database
were not changed; no API contract or migration is involved.

Use `npm start` after building, or:

```sh
NODE_ENV=production node --env-file=.env .output/server/index.mjs
```

Keep that environment in PM2/systemd configurations too. Increasing the heap limit alone
would merely delay this leak. The site still uses its existing tmux process management;
automatic restart supervision has not been introduced.

An additional code fix scopes the shared DOMPurify link hook to each synchronous sanitize
call and removes it in `finally`. This prevents callbacks accumulating per SSR component.
It is a separate defect, not the demonstrated source of the login-page leak.

## Repeat the regression check

```sh
npm run build
npm run test:ssr-memory
```

The checker starts a local fixture backend, warms 100 login requests, then checks 1,000
more. It requires HTTP 200, a server-rendered password field, and less than 32 MiB retained
heap growth after warmup. It does not load `.env` or use a live API. To reproduce the bad
environment deliberately on a local machine, run `env -u NODE_ENV node --expose-gc
scripts/check-ssr-memory.mjs`; the retained-heap assertion should fail.

Watch the production process over the next several days. RSS includes memory outside
the JavaScript heap and is not expected to equal these local GC measurements.
