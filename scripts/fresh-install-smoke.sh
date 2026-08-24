#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "사용법: fresh-install-smoke.sh <release.tar.gz>" >&2
  exit 2
fi

readonly NUBO_ARCHIVE_PATH="$(realpath "${1:-}")"
readonly NUBO_CHECKSUM_PATH="${NUBO_ARCHIVE_PATH}.sha256"
readonly NUBO_RELEASE_NAME="$(basename "${NUBO_ARCHIVE_PATH}" .tar.gz)"
readonly NUBO_RELEASE_DIR="/opt/nubo/releases/${NUBO_RELEASE_NAME}"
readonly NUBO_NODE_BINARY="$(realpath "$(command -v node)")"
readonly NUBO_INPUT_ROOT="${RUNNER_TEMP:-/tmp}"
readonly NUBO_INPUT_FILE="${NUBO_INPUT_ROOT}/nubo-fresh-install.env"
readonly NUBO_READY_FILE="${NUBO_INPUT_ROOT}/nubo-ready.json"
readonly NUBO_VERSION_FILE="${NUBO_INPUT_ROOT}/nubo-version.json"

# root와 일반 hosted runner에서 같은 명령을 실행한다.
run_root() {
  if [[ ${EUID} -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

NUBO_APT_METADATA_READY=false
prepare_apt_metadata() {
  if [[ "${NUBO_APT_METADATA_READY}" == "false" ]]; then
    echo "[fresh-install] apt metadata 준비"
    run_root timeout --foreground 5m apt-get update -qq
    NUBO_APT_METADATA_READY=true
  fi
}

# 실패한 hosted runner에서 서비스 원인을 바로 확인할 수 있게 로그를 남긴다.
diagnose() {
  local exit_code=$?
  if [[ ${exit_code} -ne 0 ]]; then
    systemctl --no-pager --full status nubo.service nubo-goapi.service nubo-web.service || true
    journalctl --no-pager -n 200 -u nubo-goapi.service -u nubo-web.service || true
  fi
  exit "${exit_code}"
}

if [[ "${GITHUB_ACTIONS:-}" != "true" || "${RUNNER_ENVIRONMENT:-}" != "github-hosted" ]]; then
  if [[ "${NUBO_ALLOW_LOCAL_FRESH_INSTALL:-}" != "1" ]]; then
    echo "Fresh-install smoke는 일회용 GitHub hosted runner에서만 실행합니다." >&2
    exit 1
  fi
fi

if [[ ! "${NUBO_RELEASE_NAME}" =~ ^nubo-[0-9A-Za-z.+-]+-linux-amd64$ ]]; then
  echo "올바르지 않은 릴리스 파일명입니다: ${NUBO_RELEASE_NAME}" >&2
  exit 1
fi
for NUBO_REQUIRED_FILE in "${NUBO_ARCHIVE_PATH}" "${NUBO_CHECKSUM_PATH}"; do
  if [[ ! -f "${NUBO_REQUIRED_FILE}" ]]; then
    echo "릴리스 검증 파일이 없습니다: ${NUBO_REQUIRED_FILE}" >&2
    exit 1
  fi
done
for NUBO_UNUSED_PATH in /opt/nubo/current /etc/nubo/nubo.env /etc/systemd/system/nubo.service; do
  if [[ -e "${NUBO_UNUSED_PATH}" || -L "${NUBO_UNUSED_PATH}" ]]; then
    echo "깨끗한 runner가 아닙니다: ${NUBO_UNUSED_PATH}" >&2
    exit 1
  fi
done
trap diagnose EXIT

NUBO_MISSING_PACKAGES=()
command -v curl >/dev/null 2>&1 || NUBO_MISSING_PACKAGES+=(curl)
[[ -f /etc/ssl/certs/ca-certificates.crt ]] || NUBO_MISSING_PACKAGES+=(ca-certificates)
if [[ ${#NUBO_MISSING_PACKAGES[@]} -gt 0 ]]; then
  prepare_apt_metadata
  echo "[fresh-install] 기본 패키지 설치: ${NUBO_MISSING_PACKAGES[*]}"
  run_root timeout --foreground 5m env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${NUBO_MISSING_PACKAGES[@]}" >/dev/null
else
  echo "[fresh-install] 기본 패키지 준비됨"
fi
if systemctl list-unit-files mysql.service --no-legend 2>/dev/null | grep -q '^mysql.service'; then
  NUBO_DATABASE_SERVICE="mysql.service"
  NUBO_DATABASE_CLIENT="mysql"
elif systemctl list-unit-files mariadb.service --no-legend 2>/dev/null | grep -q '^mariadb.service'; then
  NUBO_DATABASE_SERVICE="mariadb.service"
  NUBO_DATABASE_CLIENT="mariadb"
else
  prepare_apt_metadata
  echo "[fresh-install] MariaDB 설치"
  run_root timeout --foreground 5m env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server >/dev/null
  NUBO_DATABASE_SERVICE="mariadb.service"
  NUBO_DATABASE_CLIENT="mariadb"
fi
readonly NUBO_DATABASE_SERVICE NUBO_DATABASE_CLIENT
echo "[fresh-install] ${NUBO_DATABASE_SERVICE} 시작"
run_root timeout --foreground 2m systemctl enable --now "${NUBO_DATABASE_SERVICE}"

NUBO_DATABASE_ROOT_PASSWORD=""
if run_root timeout --foreground 15s env MYSQL_PWD=root "${NUBO_DATABASE_CLIENT}" --protocol=socket --user=root --execute='SELECT 1' >/dev/null 2>&1; then
  NUBO_DATABASE_ROOT_PASSWORD="root"
elif ! run_root timeout --foreground 15s "${NUBO_DATABASE_CLIENT}" --protocol=socket --user=root --execute='SELECT 1' >/dev/null 2>&1; then
  echo "[fresh-install] database root 인증에 실패했습니다." >&2
  exit 1
fi
readonly NUBO_DATABASE_ROOT_PASSWORD

run_database_root() {
  if [[ -n "${NUBO_DATABASE_ROOT_PASSWORD}" ]]; then
    run_root timeout --foreground 1m env MYSQL_PWD="${NUBO_DATABASE_ROOT_PASSWORD}" "${NUBO_DATABASE_CLIENT}" --protocol=socket --user=root
  else
    run_root timeout --foreground 1m "${NUBO_DATABASE_CLIENT}" --protocol=socket --user=root
  fi
}

echo "[fresh-install] smoke database 준비"
run_database_root <<'SQL'
CREATE DATABASE nubo_smoke CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nubo_smoke'@'127.0.0.1' IDENTIFIED BY 'nubo-smoke-db-password';
GRANT ALL PRIVILEGES ON nubo_smoke.* TO 'nubo_smoke'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

(
  cd "$(dirname "${NUBO_ARCHIVE_PATH}")"
  sha256sum --check "$(basename "${NUBO_CHECKSUM_PATH}")"
)
run_root install -d -m 0755 /opt/nubo/releases
run_root tar -xzf "${NUBO_ARCHIVE_PATH}" -C /opt/nubo/releases
if [[ ! -x "${NUBO_RELEASE_DIR}/nuboctl" ]]; then
  echo "압축 해제된 릴리스에 nuboctl이 없습니다: ${NUBO_RELEASE_DIR}" >&2
  exit 1
fi

install -m 0600 /dev/null "${NUBO_INPUT_FILE}"
cat >"${NUBO_INPUT_FILE}" <<'EOF'
GOAPI_TITLE=NUBO fresh install smoke
NUXT_PUBLIC_TITLE=NUBO fresh install smoke
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=nubo_smoke
DB_PASS=nubo-smoke-db-password
DB_NAME=nubo_smoke
DB_TABLE_PREFIX=nubo_
DB_UNIX_SOCKET=
DB_MAX_IDLE=2
DB_MAX_OPEN=4
ADMIN_ID=admin@fresh-install.invalid
ADMIN_PW=nubo-smoke-admin-password
NUXT_PUBLIC_ADMIN_ID=admin@fresh-install.invalid
EOF

echo "[fresh-install] nuboctl install 실행"
run_root timeout --foreground 5m "${NUBO_RELEASE_DIR}/nuboctl" install \
  --non-interactive \
  --domain fresh-install.invalid \
  --release "${NUBO_RELEASE_DIR}" \
  --env-input "${NUBO_INPUT_FILE}" \
  --node "${NUBO_NODE_BINARY}"

echo "[fresh-install] readiness와 version 검증"
curl --fail --silent --show-error http://127.0.0.1:3000/ready >"${NUBO_READY_FILE}"
curl --fail --silent --show-error http://127.0.0.1:3000/version >"${NUBO_VERSION_FILE}"
node - "${NUBO_RELEASE_DIR}/manifest.json" "${NUBO_READY_FILE}" "${NUBO_VERSION_FILE}" <<'NODE'
const { readFileSync } = require("node:fs")
const [manifestPath, readyPath, versionPath] = process.argv.slice(2)
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
const ready = JSON.parse(readFileSync(readyPath, "utf8"))
const version = JSON.parse(readFileSync(versionPath, "utf8"))

if (ready.status !== "ok" || ready.dependencies?.goapi !== "ok") {
  throw new Error(`/ready 응답이 정상 상태가 아닙니다: ${JSON.stringify(ready)}`)
}
if (version.status !== "ok" || version.version !== manifest.releaseVersion || version.issues?.length !== 0) {
  throw new Error(`/version 응답이 릴리스와 일치하지 않습니다: ${JSON.stringify(version)}`)
}
if (version.goapi?.version !== manifest.components?.goapi?.version) {
  throw new Error(`/version의 GOAPI 버전이 manifest와 다릅니다: ${JSON.stringify(version.goapi)}`)
}
NODE

systemctl is-active --quiet nubo-goapi.service nubo-web.service
echo "PASS ${NUBO_RELEASE_NAME}: fresh install, systemd, /ready, /version"
