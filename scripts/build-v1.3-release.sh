#!/usr/bin/env bash

set -euo pipefail

readonly NUBO_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NUBO_REQUESTED_OUTPUT_ROOT="${1:-${NUBO_PROJECT_ROOT}/dist}"
mkdir -p "${NUBO_REQUESTED_OUTPUT_ROOT}"
readonly NUBO_OUTPUT_ROOT="$(cd "${NUBO_REQUESTED_OUTPUT_ROOT}" && pwd)"

"${NUBO_PROJECT_ROOT}/scripts/build-nubo-linux.sh" "${NUBO_OUTPUT_ROOT}/nubo-linux-amd64"
"${NUBO_PROJECT_ROOT}/scripts/build-runtime-bundle.sh" "${NUBO_OUTPUT_ROOT}"

echo "Built NUBO v1.3 CLI and pinned runtime assets in ${NUBO_OUTPUT_ROOT}"
