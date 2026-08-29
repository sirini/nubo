#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "사용법: nubo-runtime-smoke.sh <asset-directory>" >&2
  exit 2
fi

readonly NUBO_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly NUBO_ASSET_ROOT="$(realpath "$1")"
readonly NUBO_RUNTIME_NAME="$(node -p "require('${NUBO_PROJECT_ROOT}/deploy/release-sources.json').runtime.name")"
readonly NUBO_VERSION="$(awk -F= '$1 == "NUXT_PUBLIC_VERSION" { print $2; exit }' "${NUBO_PROJECT_ROOT}/env.sample")"
readonly NUBO_SERVER_PORT="18765"

for required in \
  "${NUBO_ASSET_ROOT}/nubo-linux-amd64" \
  "${NUBO_ASSET_ROOT}/nubo-linux-amd64.sha256" \
  "${NUBO_ASSET_ROOT}/${NUBO_RUNTIME_NAME}" \
  "${NUBO_ASSET_ROOT}/${NUBO_RUNTIME_NAME}.sha256"; do
  if [[ ! -f "${required}" ]]; then
    echo "릴리스 asset이 없습니다: ${required}" >&2
    exit 1
  fi
done

(
  cd "${NUBO_ASSET_ROOT}"
  sha256sum --check --quiet nubo-linux-amd64.sha256
  sha256sum --check --quiet "${NUBO_RUNTIME_NAME}.sha256"
)

python3 -m http.server "${NUBO_SERVER_PORT}" --bind 127.0.0.1 --directory "${NUBO_ASSET_ROOT}" >/tmp/nubo-runtime-http.log 2>&1 &
server_pid=$!
running_cli="$(mktemp /tmp/nubo-running-cli.XXXXXX)"
cleanup() {
  kill "${server_pid}" 2>/dev/null || true
  wait "${server_pid}" 2>/dev/null || true
  rm -f "${running_cli}"
  rm -f /tmp/nubo-runtime-http.log
}
trap cleanup EXIT

for attempt in $(seq 1 30); do
  if curl --fail --silent "http://127.0.0.1:${NUBO_SERVER_PORT}/nubo-linux-amd64.sha256" >/dev/null; then
    break
  fi
  sleep 0.2
done

cd "${NUBO_PROJECT_ROOT}"
export NUBO_RELEASE_BASE_URL="http://127.0.0.1:${NUBO_SERVER_PORT}"
./bin/nubo version
install -m 0755 .nubo/bin/nubo "${running_cli}"
install -m 0755 /bin/true .nubo/bin/nubo
"${running_cli}" update --root "${NUBO_PROJECT_ROOT}" --plain
./bin/nubo update --plain --json | jq -e --arg version "${NUBO_VERSION}" '.status == "current" and .targetVersion == $version' >/dev/null
./bin/nubo version
./bin/nubo download --yes --plain
./bin/nubo download --yes --dry-run --plain

test -x .nubo/bin/nubo
test -x bin/goapi
test -f lib/libvips-cpp.so.8.18.3
test -f lib/glibc-hwcaps/x86-64-v2/libvips-cpp.so.8.18.3
test -f licenses/sharp-libvips/versions.json
test -f .nubo/runtime.json
test "$(node -p "require('./.nubo/runtime.json').version")" = "${NUBO_VERSION}"
ldd bin/goapi
! ldd bin/goapi | grep --quiet "not found"
ldd bin/goapi | grep --quiet "lib/glibc-hwcaps/x86-64-v2/libvips-cpp.so.8.18.3"
git diff --exit-code -- bin/nubo deploy/release-sources.json env.sample package.json

echo "PASS ${NUBO_RUNTIME_NAME}: bootstrap, checksum, atomic runtime install, no service control"
