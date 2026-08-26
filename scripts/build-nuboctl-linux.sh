#!/usr/bin/env bash

set -euo pipefail

readonly NUBO_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly NUBO_OUTPUT_PATH="$(realpath -m "${1:-${NUBO_PROJECT_ROOT}/nuboctl-linux}")"
readonly NUBO_MARKET_OUTPUT_PATH="$(realpath -m "${2:-${NUBO_PROJECT_ROOT}/nubo-market-linux}")"
readonly NUBO_BUILD_ROOT="$(mktemp -d)"

# 컨테이너가 만든 임시 nuboctl 빌드 디렉터리를 제거합니다.
cleanup() {
  rm -rf "${NUBO_BUILD_ROOT}"
}
trap cleanup EXIT

mkdir -p "$(dirname "${NUBO_OUTPUT_PATH}")" "$(dirname "${NUBO_MARKET_OUTPUT_PATH}")"
docker run --rm \
  --volume "${NUBO_PROJECT_ROOT}:/src:ro" \
  --volume "${NUBO_BUILD_ROOT}:/out" \
  --workdir /src/tools/nuboctl \
  golang:1.26.4-bookworm \
  bash -lc 'CGO_ENABLED=0 GOOS=linux GOARCH=amd64 /usr/local/go/bin/go build -buildvcs=false -trimpath -ldflags="-s -w" -o /out/nubo-cli .'

install -m 0755 "${NUBO_BUILD_ROOT}/nubo-cli" "${NUBO_OUTPUT_PATH}"
install -m 0755 "${NUBO_BUILD_ROOT}/nubo-cli" "${NUBO_MARKET_OUTPUT_PATH}"

for NUBO_UBUNTU_VERSION in 22.04 24.04; do
  docker run --rm \
    --volume "${NUBO_OUTPUT_PATH}:/usr/local/bin/nuboctl:ro" \
    --volume "${NUBO_MARKET_OUTPUT_PATH}:/usr/local/bin/nubo-market:ro" \
    "ubuntu:${NUBO_UBUNTU_VERSION}" \
    bash -lc '/usr/local/bin/nuboctl version && /usr/local/bin/nubo-market version'
done

echo "Built Linux amd64 nuboctl: ${NUBO_OUTPUT_PATH}"
echo "Built Linux amd64 nubo-market: ${NUBO_MARKET_OUTPUT_PATH}"
file "${NUBO_OUTPUT_PATH}"
file "${NUBO_MARKET_OUTPUT_PATH}"
