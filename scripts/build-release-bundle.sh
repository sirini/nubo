#!/usr/bin/env bash

set -euo pipefail

readonly NUBO_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly NUBO_GOAPI_ROOT="${GOAPI_SOURCE_DIR:-$(cd "${NUBO_PROJECT_ROOT}/../goapi.git" && pwd)}"
readonly NUBO_OUTPUT_ROOT="$(realpath -m "${1:-${NUBO_PROJECT_ROOT}/dist}")"
readonly NUBO_VERSION="$(awk -F= '$1 == "NUXT_PUBLIC_VERSION" { print $2; exit }' "${NUBO_PROJECT_ROOT}/env.sample")"
readonly NUBO_GOAPI_VERSION="$(awk -F= '$1 == "GOAPI_VERSION" { print $2; exit }' "${NUBO_PROJECT_ROOT}/env.sample")"
readonly NUBO_RELEASE_NAME="nubo-${NUBO_VERSION}-linux-amd64"
readonly NUBO_ARCHIVE_PATH="${NUBO_OUTPUT_ROOT}/${NUBO_RELEASE_NAME}.tar.zst"
readonly NUBO_TEMP_ROOT="$(mktemp -d)"
readonly NUBO_STAGE_ROOT="${NUBO_TEMP_ROOT}/${NUBO_RELEASE_NAME}"
readonly NUBO_VERIFY_ROOT="${NUBO_TEMP_ROOT}/verify"

cleanup() {
  rm -rf "${NUBO_TEMP_ROOT}"
}
trap cleanup EXIT

for NUBO_REQUIRED_FILE in \
  "${NUBO_PROJECT_ROOT}/.output/server/index.mjs" \
  "${NUBO_PROJECT_ROOT}/deploy/README.md" \
  "${NUBO_PROJECT_ROOT}/env.sample" \
  "${NUBO_GOAPI_ROOT}/scripts/build-ubuntu22.sh"; do
  if [[ ! -f "${NUBO_REQUIRED_FILE}" ]]; then
    echo "Missing release input: ${NUBO_REQUIRED_FILE}" >&2
    exit 1
  fi
done

if [[ -z "${NUBO_VERSION}" || -z "${NUBO_GOAPI_VERSION}" ]]; then
  echo "Missing NUBO or GOAPI version in ${NUBO_PROJECT_ROOT}/env.sample" >&2
  exit 1
fi

if [[ -e "${NUBO_ARCHIVE_PATH}" ]]; then
  echo "Release archive already exists: ${NUBO_ARCHIVE_PATH}" >&2
  exit 1
fi

mkdir -p "${NUBO_STAGE_ROOT}/bin" "${NUBO_STAGE_ROOT}/web" "${NUBO_STAGE_ROOT}/share"
cp -a "${NUBO_PROJECT_ROOT}/.output" "${NUBO_STAGE_ROOT}/web/.output"
cp -a "${NUBO_PROJECT_ROOT}/deploy/." "${NUBO_STAGE_ROOT}/share/"
install -m 0644 "${NUBO_PROJECT_ROOT}/env.sample" "${NUBO_STAGE_ROOT}/share/env.sample"
"${NUBO_GOAPI_ROOT}/scripts/build-ubuntu22.sh" "${NUBO_STAGE_ROOT}/bin/goapi"

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
  schemaVersion: 1,
  releaseVersion: "${NUBO_VERSION}",
  target: { os: "linux", arch: "amd64" },
  runtime: { node: ">=24.11.0 <27" },
  apiContract: "1",
  components: {
    nubo: { version: "${NUBO_VERSION}", commit: "${NUBO_COMMIT}", dirty: ${NUBO_DIRTY} },
    goapi: { version: "${NUBO_GOAPI_VERSION}", commit: "${GOAPI_COMMIT}", dirty: ${GOAPI_DIRTY} },
  },
  entrypoints: { web: "web/.output/server/index.mjs", goapi: "bin/goapi" },
  configuration: { sample: "share/env.sample", externalPath: "/etc/nubo/nubo.env" },
  mutableData: { uploadDefault: "/var/lib/nubo/upload", uploadVariable: "NUBO_UPLOAD_DIR" },
  serviceTemplates: { systemd: "share/systemd", nginx: "share/nginx", caddy: "share/caddy" },
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
  bash -lc "apt-get update -qq && apt-get install -y -qq zstd >/dev/null && zstd -q /work/${NUBO_RELEASE_NAME}.tar -o /work/${NUBO_RELEASE_NAME}.tar.zst && chown $(id -u):$(id -g) /work/${NUBO_RELEASE_NAME}.tar.zst"

docker run --rm \
  --volume "${NUBO_TEMP_ROOT}/${NUBO_RELEASE_NAME}.tar.zst:/release.tar.zst:ro" \
  --volume "${NUBO_VERIFY_ROOT}:/verify" \
  ubuntu:24.04 \
  bash -lc "apt-get update -qq && apt-get install -y -qq zstd >/dev/null && tar --zstd -xf /release.tar.zst -C /verify && chown -R $(id -u):$(id -g) /verify"

(
  cd "${NUBO_VERIFY_ROOT}/${NUBO_RELEASE_NAME}"
  sha256sum --check --quiet checksums.txt
  node -e 'JSON.parse(require("node:fs").readFileSync("manifest.json", "utf8"))'
  test ! -e .env
  test ! -e upload
  test ! -e node_modules
)
node "${NUBO_PROJECT_ROOT}/scripts/prebuilt-smoke.mjs" "${NUBO_VERIFY_ROOT}/${NUBO_RELEASE_NAME}/web/.output"
mv "${NUBO_TEMP_ROOT}/${NUBO_RELEASE_NAME}.tar.zst" "${NUBO_ARCHIVE_PATH}"

echo "Built and verified ${NUBO_ARCHIVE_PATH}"
