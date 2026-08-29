#!/usr/bin/env bash

set -euo pipefail

readonly NUBO_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NUBO_REQUESTED_OUTPUT="${1:-${NUBO_PROJECT_ROOT}/dist/nubo-linux-amd64}"
mkdir -p "$(dirname "${NUBO_REQUESTED_OUTPUT}")"
readonly NUBO_OUTPUT_PATH="$(cd "$(dirname "${NUBO_REQUESTED_OUTPUT}")" && pwd)/$(basename "${NUBO_REQUESTED_OUTPUT}")"
readonly NUBO_BUILD_ROOT="$(mktemp -d)"
readonly NUBO_VERSION="$(awk -F= '$1 == "NUXT_PUBLIC_VERSION" { print $2; exit }' "${NUBO_PROJECT_ROOT}/env.sample")"

cleanup() {
  rm -rf "${NUBO_BUILD_ROOT}"
}
trap cleanup EXIT

if [[ -z "${NUBO_VERSION}" ]]; then
  echo "Missing NUXT_PUBLIC_VERSION in env.sample" >&2
  exit 1
fi
docker run --rm \
  --volume "${NUBO_PROJECT_ROOT}:/src:ro" \
  --volume "${NUBO_BUILD_ROOT}:/out" \
  --workdir /src/tools/nubo \
  golang:1.26.4-bookworm \
  bash -lc "CGO_ENABLED=0 GOOS=linux GOARCH=amd64 /usr/local/go/bin/go build -buildvcs=false -trimpath -ldflags='-s -w -X main.version=${NUBO_VERSION}' -o /out/nubo ."

install -m 0755 "${NUBO_BUILD_ROOT}/nubo" "${NUBO_OUTPUT_PATH}"
(
  cd "$(dirname "${NUBO_OUTPUT_PATH}")"
  sha256sum "$(basename "${NUBO_OUTPUT_PATH}")" > "$(basename "${NUBO_OUTPUT_PATH}").sha256"
)

for NUBO_UBUNTU_VERSION in 22.04 24.04; do
  docker run --rm \
    --volume "${NUBO_OUTPUT_PATH}:/usr/local/bin/nubo:ro" \
    "ubuntu:${NUBO_UBUNTU_VERSION}" \
    /usr/local/bin/nubo version
done

echo "Built Linux amd64 NUBO CLI: ${NUBO_OUTPUT_PATH}"
file "${NUBO_OUTPUT_PATH}"
