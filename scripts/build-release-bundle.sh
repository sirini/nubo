#!/usr/bin/env bash

set -euo pipefail

readonly NUBO_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly NUBO_GOAPI_ROOT="${GOAPI_SOURCE_DIR:-$(cd "${NUBO_PROJECT_ROOT}/../goapi.git" && pwd)}"
readonly NUBO_RELEASE_SOURCES="${NUBO_PROJECT_ROOT}/deploy/release-sources.json"
readonly NUBO_OUTPUT_ROOT="$(realpath -m "${1:-${NUBO_PROJECT_ROOT}/dist}")"
readonly NUBO_VERSION="$(awk -F= '$1 == "NUXT_PUBLIC_VERSION" { print $2; exit }' "${NUBO_PROJECT_ROOT}/env.sample")"
readonly NUBO_GOAPI_VERSION="$(awk -F= '$1 == "GOAPI_VERSION" { print $2; exit }' "${NUBO_PROJECT_ROOT}/env.sample")"
readonly NUBO_RELEASE_NAME="nubo-${NUBO_VERSION}-linux-amd64"
readonly NUBO_ARCHIVE_PATH="${NUBO_OUTPUT_ROOT}/${NUBO_RELEASE_NAME}.tar.gz"
readonly NUBO_CHECKSUM_PATH="${NUBO_ARCHIVE_PATH}.sha256"
readonly NUBO_TEMP_ROOT="$(mktemp -d)"
readonly NUBO_STAGE_ROOT="${NUBO_TEMP_ROOT}/${NUBO_RELEASE_NAME}"
readonly NUBO_VERIFY_ROOT="${NUBO_TEMP_ROOT}/verify"

# 임시 staging과 검증 디렉터리를 작업 성공 여부와 관계없이 제거합니다.
cleanup() {
  rm -rf "${NUBO_TEMP_ROOT}"
}
trap cleanup EXIT

for NUBO_REQUIRED_FILE in \
  "${NUBO_PROJECT_ROOT}/.output/server/index.mjs" \
  "${NUBO_PROJECT_ROOT}/INSTALL_GUIDE_FOR_AI.md" \
  "${NUBO_PROJECT_ROOT}/deploy/README.md" \
  "${NUBO_PROJECT_ROOT}/env.sample" \
  "${NUBO_PROJECT_ROOT}/scripts/build-nuboctl-linux.sh" \
  "${NUBO_RELEASE_SOURCES}" \
  "${NUBO_GOAPI_ROOT}/scripts/build-ubuntu22.sh"; do
  if [[ ! -f "${NUBO_REQUIRED_FILE}" ]]; then
    echo "Missing release input: ${NUBO_REQUIRED_FILE}" >&2
    exit 1
  fi
done

NUBO_EXPECTED_GOAPI_COMMIT="$(node -p "require('${NUBO_RELEASE_SOURCES}').goapi.commit")"
NUBO_ACTUAL_GOAPI_COMMIT="$(git -C "${NUBO_GOAPI_ROOT}" rev-parse HEAD)"
if [[ "${NUBO_ACTUAL_GOAPI_COMMIT}" != "${NUBO_EXPECTED_GOAPI_COMMIT}" ]]; then
  echo "GOAPI checkout must match deploy/release-sources.json: expected ${NUBO_EXPECTED_GOAPI_COMMIT}, got ${NUBO_ACTUAL_GOAPI_COMMIT}" >&2
  exit 1
fi

if [[ -z "${NUBO_VERSION}" || -z "${NUBO_GOAPI_VERSION}" ]]; then
  echo "Missing NUBO or GOAPI version in ${NUBO_PROJECT_ROOT}/env.sample" >&2
  exit 1
fi

mkdir -p "${NUBO_STAGE_ROOT}/bin" "${NUBO_STAGE_ROOT}/lib" "${NUBO_STAGE_ROOT}/licenses" "${NUBO_STAGE_ROOT}/web" "${NUBO_STAGE_ROOT}/share"
cp -a "${NUBO_PROJECT_ROOT}/.output" "${NUBO_STAGE_ROOT}/web/.output"
cp -a "${NUBO_PROJECT_ROOT}/deploy/." "${NUBO_STAGE_ROOT}/share/"
install -m 0644 "${NUBO_PROJECT_ROOT}/env.sample" "${NUBO_STAGE_ROOT}/share/env.sample"
install -m 0644 "${NUBO_PROJECT_ROOT}/INSTALL_GUIDE_FOR_AI.md" "${NUBO_STAGE_ROOT}/INSTALL_GUIDE_FOR_AI.md"
"${NUBO_PROJECT_ROOT}/scripts/build-nuboctl-linux.sh" "${NUBO_STAGE_ROOT}/nuboctl"
"${NUBO_GOAPI_ROOT}/scripts/build-ubuntu22.sh" \
  "${NUBO_STAGE_ROOT}/bin/goapi" \
  "${NUBO_STAGE_ROOT}/lib" \
  "${NUBO_STAGE_ROOT}/licenses/sharp-libvips"
NUBOCTL_VERSION="$("${NUBO_STAGE_ROOT}/nuboctl" version | awk '{print $2}')"

NUBO_COMMIT="$(git -C "${NUBO_PROJECT_ROOT}" rev-parse HEAD)"
GOAPI_COMMIT="$(git -C "${NUBO_GOAPI_ROOT}" rev-parse HEAD)"
NUBO_DIRTY=false
GOAPI_DIRTY=false
[[ -z "$(git -C "${NUBO_PROJECT_ROOT}" status --porcelain)" ]] || NUBO_DIRTY=true
[[ -z "$(git -C "${NUBO_GOAPI_ROOT}" status --porcelain)" ]] || GOAPI_DIRTY=true

node - "${NUBO_STAGE_ROOT}/manifest.json" <<EOF
const { writeFileSync } = require("node:fs")
const [manifestPath] = process.argv.slice(2)
writeFileSync(manifestPath, JSON.stringify({
  schemaVersion: 2,
  releaseVersion: "${NUBO_VERSION}",
  target: { os: "linux", arch: "amd64" },
  runtime: { node: ">=22" },
  apiContract: "1",
  nativeLibraries: {
    libvips: {
      version: "8.18.3",
      selection: "glibc-hwcaps",
      variants: {
        "x86-64": {
          path: "lib/libvips-cpp.so.8.18.3",
          source: "sharp-libvips@4da6d14c0d59866adfb9d8cf52bcaa53846dc4f6 (-march=x86-64)",
        },
        "x86-64-v2": {
          path: "lib/glibc-hwcaps/x86-64-v2/libvips-cpp.so.8.18.3",
          source: "@img/sharp-libvips-linux-x64@1.3.2",
        },
      },
    },
  },
  components: {
    nubo: { version: "${NUBO_VERSION}", commit: "${NUBO_COMMIT}", dirty: ${NUBO_DIRTY} },
    goapi: { version: "${NUBO_GOAPI_VERSION}", commit: "${GOAPI_COMMIT}", dirty: ${GOAPI_DIRTY} },
    nuboctl: { version: "${NUBOCTL_VERSION}", commit: "${NUBO_COMMIT}", dirty: ${NUBO_DIRTY} },
  },
  entrypoints: { web: "web/.output/server/index.mjs", goapi: "bin/goapi", nuboctl: "nuboctl" },
  configuration: { sample: "share/env.sample", externalPath: "/etc/nubo/nubo.env" },
  mutableData: { uploadDefault: "/var/lib/nubo/upload", uploadVariable: "NUBO_UPLOAD_DIR" },
  serviceTemplates: { systemd: "share/systemd", nginx: "share/nginx" },
}, null, 2) + "\n", { mode: 0o644 })
EOF

(
  cd "${NUBO_STAGE_ROOT}"
  find . -type f ! -name checksums.txt -print0 | sort -z | xargs -0 sha256sum > checksums.txt
  sha256sum --check --quiet checksums.txt
)

mkdir -p "${NUBO_OUTPUT_ROOT}" "${NUBO_VERIFY_ROOT}"
tar -C "${NUBO_TEMP_ROOT}" -cf "${NUBO_TEMP_ROOT}/${NUBO_RELEASE_NAME}.tar" "${NUBO_RELEASE_NAME}"
docker run --rm \
  --volume "${NUBO_TEMP_ROOT}:/work" \
  ubuntu:22.04 \
  bash -lc "gzip -n -9 /work/${NUBO_RELEASE_NAME}.tar && chown $(id -u):$(id -g) /work/${NUBO_RELEASE_NAME}.tar.gz"

docker run --rm \
  --volume "${NUBO_TEMP_ROOT}/${NUBO_RELEASE_NAME}.tar.gz:/release.tar.gz:ro" \
  --volume "${NUBO_VERIFY_ROOT}:/verify" \
  ubuntu:24.04 \
  bash -lc "tar -xzf /release.tar.gz -C /verify && chown -R $(id -u):$(id -g) /verify"

(
  cd "${NUBO_VERIFY_ROOT}/${NUBO_RELEASE_NAME}"
  sha256sum --check --quiet checksums.txt
  node -e 'JSON.parse(require("node:fs").readFileSync("manifest.json", "utf8"))'
  test ! -e .env
  test ! -e upload
  test ! -e node_modules
  test -f INSTALL_GUIDE_FOR_AI.md
  test -f lib/libvips-cpp.so.8.18.3
  test -f lib/glibc-hwcaps/x86-64-v2/libvips-cpp.so.8.18.3
  test -f licenses/sharp-libvips/compat-build.json
  test -f licenses/sharp-libvips/versions.json
  test -f share/install-input.sample
  ldd bin/goapi
  ! ldd bin/goapi | grep --quiet "not found"
  ldd bin/goapi | grep --quiet "lib/glibc-hwcaps/x86-64-v2/libvips-cpp.so.8.18.3"
  ./nuboctl version
)
node "${NUBO_PROJECT_ROOT}/scripts/prebuilt-smoke.mjs" "${NUBO_VERIFY_ROOT}/${NUBO_RELEASE_NAME}/web/.output"
mv "${NUBO_TEMP_ROOT}/${NUBO_RELEASE_NAME}.tar.gz" "${NUBO_ARCHIVE_PATH}"
(
  cd "${NUBO_OUTPUT_ROOT}"
  sha256sum "$(basename "${NUBO_ARCHIVE_PATH}")" > "$(basename "${NUBO_CHECKSUM_PATH}")"
)

echo "Built and verified ${NUBO_ARCHIVE_PATH} and ${NUBO_CHECKSUM_PATH}"
