#!/usr/bin/env bash

set -euo pipefail

readonly NUBO_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly NUBO_GOAPI_ROOT="${GOAPI_SOURCE_DIR:-$(cd "${NUBO_PROJECT_ROOT}/../goapi.git" && pwd)}"
NUBO_REQUESTED_OUTPUT_ROOT="${1:-${NUBO_PROJECT_ROOT}/dist}"
mkdir -p "${NUBO_REQUESTED_OUTPUT_ROOT}"
readonly NUBO_OUTPUT_ROOT="$(cd "${NUBO_REQUESTED_OUTPUT_ROOT}" && pwd)"
readonly NUBO_SOURCES="${NUBO_PROJECT_ROOT}/deploy/release-sources.json"
readonly NUBO_RUNTIME_NAME="$(node -p "require('${NUBO_SOURCES}').runtime.name.replace(/\\.tar\\.gz$/, '')")"
readonly NUBO_ARCHIVE="${NUBO_OUTPUT_ROOT}/${NUBO_RUNTIME_NAME}.tar.gz"
readonly NUBO_TEMP_ROOT="$(mktemp -d)"
readonly NUBO_STAGE_ROOT="${NUBO_TEMP_ROOT}/${NUBO_RUNTIME_NAME}"

cleanup() {
  rm -rf "${NUBO_TEMP_ROOT}"
}
trap cleanup EXIT

expected_commit="$(node -p "require('${NUBO_SOURCES}').goapi.commit")"
actual_commit="$(git -C "${NUBO_GOAPI_ROOT}" rev-parse HEAD)"
if [[ "${actual_commit}" != "${expected_commit}" ]]; then
  echo "GOAPI checkout does not match descriptor: ${actual_commit} != ${expected_commit}" >&2
  exit 1
fi

mkdir -p "${NUBO_STAGE_ROOT}/bin" "${NUBO_STAGE_ROOT}/lib" "${NUBO_STAGE_ROOT}/licenses" "${NUBO_OUTPUT_ROOT}"
"${NUBO_GOAPI_ROOT}/scripts/build-ubuntu22.sh" \
  "${NUBO_STAGE_ROOT}/bin/goapi" \
  "${NUBO_STAGE_ROOT}/lib" \
  "${NUBO_STAGE_ROOT}/licenses/sharp-libvips"

node - "${NUBO_STAGE_ROOT}/manifest.json" "${NUBO_SOURCES}" "${NUBO_PROJECT_ROOT}/env.sample" <<'NODE'
const { readFileSync, writeFileSync } = require("node:fs")
const [manifestPath, sourcesPath, environmentPath] = process.argv.slice(2)
const sources = JSON.parse(readFileSync(sourcesPath, "utf8"))
const environment = Object.fromEntries(readFileSync(environmentPath, "utf8").split(/\r?\n/).filter(Boolean).map(line => {
  const index = line.indexOf("=")
  return index < 0 ? [line, ""] : [line.slice(0, index), line.slice(index + 1)]
}))
writeFileSync(manifestPath, JSON.stringify({
  schemaVersion: 1,
  releaseVersion: sources.channel.version,
  target: sources.target,
  apiContract: sources.apiContract,
  migrationRequired: sources.runtime.migrationRequired,
  goapi: { version: environment.GOAPI_VERSION, commit: sources.goapi.commit },
  nativeLibraries: { libvips: "8.18.3", selection: "glibc-hwcaps" },
}, null, 2) + "\n", { mode: 0o644 })
NODE

(
  cd "${NUBO_STAGE_ROOT}"
  find . -type f ! -name checksums.txt -print0 | sort -z | xargs -0 sha256sum > checksums.txt
  sha256sum --check --quiet checksums.txt
)

docker run --rm \
  --volume "${NUBO_TEMP_ROOT}:/work" \
  ubuntu:22.04 \
  bash -lc "cd /work && tar --sort=name --mtime=@0 --owner=0 --group=0 --numeric-owner -cf ${NUBO_RUNTIME_NAME}.tar ${NUBO_RUNTIME_NAME} && gzip -n -9 ${NUBO_RUNTIME_NAME}.tar && chown $(id -u):$(id -g) ${NUBO_RUNTIME_NAME}.tar.gz"

mv "${NUBO_TEMP_ROOT}/${NUBO_RUNTIME_NAME}.tar.gz" "${NUBO_ARCHIVE}"
(
  cd "${NUBO_OUTPUT_ROOT}"
  sha256sum "$(basename "${NUBO_ARCHIVE}")" > "$(basename "${NUBO_ARCHIVE}").sha256"
)

echo "Built runtime bundle: ${NUBO_ARCHIVE}"
