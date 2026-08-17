# NUBO Linux service templates

These templates are inputs for `nuboctl install`. They are not ready to copy into `/etc` until every
`@TOKEN@` has been replaced. The supported first target is Ubuntu 22.04/24.04 on amd64.

The release-root `nuboctl` renders these files without activating or reloading systemd or Nginx and
also provides read-only `doctor` and `status` commands; see `docs/NUBOCTL.md` in the source repository.

Recommended defaults:

| Token | Default |
| --- | --- |
| `@NUBO_USER@` | `nubo` |
| `@NUBO_GROUP@` | `nubo` |
| `@NUBO_RELEASE_DIR@` | `/opt/nubo/current` |
| `@NUBO_STATE_DIR@` | `/var/lib/nubo` |
| `@NUBO_UPLOAD_DIR@` | `/var/lib/nubo/upload` |
| `@NUBO_ENV_FILE@` | `/etc/nubo/nubo.env` |
| `@NODE_BINARY@` | discovered absolute Node path, commonly `/usr/bin/node` |
| `@NUBO_DOMAIN@` | the site's public host name |
| `@NUBO_WEB_PORT@` | `3000` |
| `@NUBO_GOAPI_PORT@` | `3006` |
| `@NUBO_GOAPI_PATH@` | `goapi` |
| `@NUBO_MAX_BODY_SIZE@` | `100m` or another Nginx-compatible size |

An existing upload tree may be used directly, for example
`@NUBO_UPLOAD_DIR@=/var/www/nubohub.org/upload`. Use the same rendered path in the GOAPI unit and the
Nginx configuration, set `NUBO_UPLOAD_DIR` to it in `nubo.env`, and grant the NUBO service user write
access plus the Nginx user read/traverse access. Existing upload symlinks remain valid, but a direct
absolute path makes ownership and service hardening easier to audit.

Nginx is the only supported reverse proxy for the first Ubuntu release. On a clean server the future
installer may create a new site configuration, validate it with `nginx -t`, and reload Nginx. If a
configuration for the target domain already exists—or an existing installation is being adopted—the
installer must not edit, enable, disable, or reload Nginx; it may only report the recommended changes.

The systemd units log to the journal and are grouped by `nubo.target`; `nubo-web.service` starts after
GOAPI but each process can restart independently.
