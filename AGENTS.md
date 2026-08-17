# NUBO working agreement

## Product direction

NUBO is a reusable community builder and media-oriented publishing platform. It should support photo communities, blogs, boards, and internal or external deployments without coupling core behavior to one deployment.

## Collaboration

- The product owner defines product behavior, visual direction, usability, and performs final QA.
- Codex critically reviews proposals, implements agreed changes, tests them, and commits and pushes completed work units.
- Do not merge stabilization or feature branches into `main` until product-owner QA is complete.
- Preserve unrelated user changes and avoid destructive Git operations.

## Workflow

- Read `docs/PROJECT_STATUS.md` at the beginning of work when it exists.
- Keep that tracked file concise and current: active goal, open findings, decisions, verification, and next action.
- Remove resolved work from active sections; retain only a short recent-completion note when useful.
- Use `docs/NUBO_COMMUNITY_OS_ROADMAP.md` as adaptable long-term direction, not as a mandatory implementation sequence. Confirm current product state and agree on a bounded scope before starting a large roadmap item.
- Use focused commits for coherent work units. After a successful commit, push the current branch without asking again.
- Run validation proportional to the change. For frontend work, include relevant lint/type/build/tests where available.
- Treat the frontend and the sibling GOAPI backend repository as one product; check API contract effects across both repositories.
- Replace the bundled `goapi-linux` only with the output of GOAPI's `./scripts/build-ubuntu22.sh`; never bundle a binary compiled directly on the host OS.

## Current design direction

- Planned visual redesign: a restrained warm-tone light/dark interface inspired by the overall atmosphere of claude.ai, without copying proprietary assets or exact layouts.
- Stabilize security, authentication, SSR, and dependencies before broad feature or visual work.
