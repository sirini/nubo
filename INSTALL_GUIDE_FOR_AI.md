# AI를 위한 NUBO Source Mode 계약

이 문서는 AI 에이전트가 Ubuntu 서버의 NUBO source checkout에서 안전하게 작업하기 위한 계약이다.

## 지원 환경

- Ubuntu 22.04 이상 Linux amd64
- Node.js 22 이상
- MySQL 또는 MariaDB
- `git clone`한 NUBO 작업 공간
- 운영자가 선택한 tmux 또는 PM2 등의 프로세스 관리 방식

공식 GOAPI와 libvips는 `./bin/nubo download`로만 준비한다. 호스트에서 GOAPI를 직접 빌드하거나 시스템
`libvips-dev`를 설치하지 않는다.

## 반드시 지킬 규칙

1. 실제 runtime 교체 전 `./bin/nubo download --dry-run`을 성공시킨다.
2. 기존 사이트에서는 DB와 업로드의 서버 외부 백업을 운영자에게 확인한다.
3. `.env`의 비밀값을 출력하거나 CLI 인자로 전달하지 않는다.
4. NUBO CLI가 DB migration, npm build 또는 프로세스 재시작을 했다고 가정하지 않는다.
5. tmux·PM2·systemd와 Nginx/TLS는 운영자 소유이며 명시적 요청 없이 변경하지 않는다.
6. 실패하면 기존 runtime과 프로세스 상태를 먼저 확인하고 오류 출력을 보존한다.

## Runtime 준비

프로젝트 루트에서 현재 checkout에 고정된 asset을 검증한다.

```bash
./bin/nubo download --dry-run --plain
```

버전, GOAPI commit, API contract와 변경 경로가 의도와 같을 때만 설치한다.

```bash
./bin/nubo download --yes --plain
```

자동화가 구조화된 결과를 필요로 할 때만 `--json`을 사용한다. 진행 로그는 stderr, 최종 JSON은 stdout에
출력된다.

## 새 사이트 준비

```bash
cp env.sample .env
chmod 0600 .env
```

운영자가 제공한 DB·사이트·관리자·JWT 값을 `.env`에 설정한다. 새 DB의 최초 스키마와 관리자 준비에만
다음을 실행한다.

```bash
./bin/goapi install
```

기존 사이트에서는 릴리스가 migration 필요를 명시하고 외부 백업이 확인된 경우에만 같은 명령을 실행한다.
GOAPI migration은 자동 rollback되지 않는다.

## Web 빌드와 실행

```bash
npm install
npm run build
```

운영자가 tmux를 선택했다면 별도 창에서 다음 프로세스를 실행한다.

```bash
./bin/goapi
node --env-file=.env .output/server/index.mjs
```

기존 tmux 또는 PM2 사이트의 재시작 방법을 추측하지 않는다. runtime 교체와 Web build가 끝난 뒤 실제
명령을 운영자에게 보여주고 명시적인 요청이 있을 때만 수행한다.

## 검증

```bash
test -x bin/goapi
test -f lib/libvips-cpp.so.8.18.3
test -f .nubo/runtime.json
curl -fsS http://127.0.0.1:3000/ready
curl -fsS http://127.0.0.1:3006/health
```

Nginx와 TLS 설정은 운영자 책임이다. AI는 별도 승인이 없으면 `/etc/nginx`를 수정하거나 reload하지 않는다.

## 종료 코드

- `0`: 검증 또는 작업 성공
- `1`: 다운로드·검증·설치 실패
- `2`: 알 수 없는 명령 또는 잘못된 옵션
