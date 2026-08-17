#!/usr/bin/env bash

set -euo pipefail

readonly NUBO_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly NUBO_OUTPUT_DIRECTORY="$(realpath "${1:-${NUBO_PROJECT_ROOT}/.output}")"
readonly NUBO_NODE_EXECUTABLE="$(realpath "$(command -v node)")"
readonly NUBO_NODE_ROOT="$(dirname "$(dirname "${NUBO_NODE_EXECUTABLE}")")"

if [[ ! -f "${NUBO_OUTPUT_DIRECTORY}/server/index.mjs" ]]; then
  echo "Missing prebuilt server: ${NUBO_OUTPUT_DIRECTORY}/server/index.mjs" >&2
  exit 1
fi

for NUBO_UBUNTU_VERSION in 22.04 24.04; do
  echo "Running prebuilt smoke test on Ubuntu ${NUBO_UBUNTU_VERSION}"
  docker run --rm \
    --volume "${NUBO_NODE_ROOT}:/node:ro" \
    --volume "${NUBO_PROJECT_ROOT}/scripts/prebuilt-smoke.mjs:/prebuilt-smoke.mjs:ro" \
    --volume "${NUBO_OUTPUT_DIRECTORY}:/artifact:ro" \
    "ubuntu:${NUBO_UBUNTU_VERSION}" \
    bash -lc \
    "apt-get update -qq && apt-get install -y -qq libatomic1 >/dev/null && /node/bin/node /prebuilt-smoke.mjs /artifact"
done
