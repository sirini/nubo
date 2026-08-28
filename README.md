# 🐿️ NUBO

<p align="center">
  <img src="https://img.shields.io/github/v/release/sirini/nubo?style=flat-square&color=E07A5F" alt="release">
  <img src="https://img.shields.io/github/license/sirini/nubo?style=flat-square&color=5D6D7E" alt="license">
  <img src="https://img.shields.io/github/stars/sirini/nubo?style=flat-square&color=F4D03F" alt="stars">
</p>

NUBO는 사진 커뮤니티, 블로그, 게시판과 사내 커뮤니티를 만드는 오픈소스 커뮤니티 빌더입니다.
Nuxt 4 웹과 GoFiber v3 기반 [GOAPI](https://github.com/sirini/goapi), MySQL/MariaDB를 함께 사용합니다.

> 문서 기준: 2026-08-27 · 통합 버전: NUBO/GOAPI 1.3.0

공식 릴리스는 NUBO·GOAPI·libvips·관리 도구를 하나의 검증된 bundle로 제공합니다. 버전과 실제 commit,
API contract는 릴리스 manifest에 기록되므로 운영자가 프론트엔드와 백엔드 조합을 고를 필요가 없습니다.

## 주요 기능

- 게시판, 사진 갤러리, 블로그, 웹진과 중고거래형 게시판
- SSR 기반 공개 게시물과 반응형 light/dark UI
- 회원·권한·댓글·알림·채팅·사진 업로드
- Resend 기반 이메일 인증, 초대 전용 가입, 비밀번호 초기화와 단체 메일
- Google·Naver·Kakao 소셜 로그인과 Android 클라이언트용 API v1
- 소스 스킨과 [NUBO Market](https://nubohub.org/market/)을 통한 화면 확장

두 프로세스는 기본적으로 다음 포트를 사용합니다.

| 구성 | 포트 | 역할 |
| --- | ---: | --- |
| Nuxt/Nitro | `3000` | SSR, 브라우저 API 중계, 인증 쿠키 |
| GOAPI | `3006` | DB, 회원·게시물·메일·파일 처리 |

## 운영 방식 선택

NUBO v1.3.0은 운영 방식을 명확히 나눕니다.

| 방식 | 적합한 경우 | 빌드·재시작 |
| --- | --- | --- |
| 공식 릴리스 | 공개 서비스, systemd, 재현 가능한 설치 | prebuilt 사용, `nuboctl apply`가 전환 |
| Source Mode | 스킨을 자주 수정하는 소규모·사내 운영 | 운영자가 `npm run build` 후 직접 재시작 |

`nuboctl`은 상태 점검과 준비된 릴리스 적용에 집중합니다. `nubo-market`은 스킨 소스만 관리하며 빌드,
Git 변경, PM2·systemd·tmux 재시작을 수행하지 않습니다.

## 공식 릴리스 설치

지원 범위는 Ubuntu 22.04 이상 x86-64, Node.js 22 이상, MySQL 8 또는 MariaDB입니다. GOAPI 저장소,
Go toolchain과 시스템 libvips는 필요하지 않습니다. Nginx와 TLS는 운영자가 별도로 관리합니다.

```bash
git clone --depth=1 https://github.com/sirini/nubo.git
cd nubo
npm run server:install
```

설치가 끝나면 GOAPI와 Web은 `nubo.service` 아래에서 실행되고 두 명령이 PATH에 등록됩니다.

```bash
nuboctl status
nuboctl doctor
nubo-market help
sudo systemctl restart nubo
sudo journalctl -u nubo-goapi -u nubo-web -f
```

### 공식 릴리스 업데이트

다운로드·검증·배치와 실제 서비스 변경을 분리합니다.

```bash
git pull --ff-only
npm run server:stage
```

`server:stage`는 현재 버전의 asset과 SHA-256을 검증해 `/opt/nubo/releases`에 준비하고, 실행할 정확한
`nuboctl apply` 명령을 출력합니다. 이 단계는 DB, `current` 링크와 실행 중인 서비스를 바꾸지 않습니다.

```bash
sudo /opt/nubo/releases/nubo-1.3.0-linux-amd64/nuboctl \
  apply /opt/nubo/releases/nubo-1.3.0-linux-amd64 --dry-run
sudo /opt/nubo/releases/nubo-1.3.0-linux-amd64/nuboctl \
  apply /opt/nubo/releases/nubo-1.3.0-linux-amd64
```

`apply`는 명시한 후보의 manifest·checksum·플랫폼을 다시 검사하고, 필요한 DB migration, 원자적 전환,
재시작과 readiness 확인만 수행합니다. 다운로드, `git pull`, npm 설치와 Nuxt 빌드는 하지 않습니다.
GOAPI가 바뀌는 릴리스는 DB와 업로드를 서버 밖에 백업한 뒤 적용하세요.

기존 `nuboctl update`, `customize`, `market`과 `npm run server:update`는 호환을 위해 남아 있지만 새 운영
절차의 기본 진입점은 아닙니다.

### 제한망에서 릴리스 반입

외부 PC에서 같은 이름의 archive와 `.sha256`을 받아 서버로 옮깁니다.

```bash
NUBO_VERSION=$(awk -F= '$1 == "NUXT_PUBLIC_VERSION" { print $2; exit }' env.sample)
NUBO_ASSET="nubo-${NUBO_VERSION}-linux-amd64.tar.gz"
NUBO_RELEASE_URL="https://github.com/sirini/nubo/releases/download/v${NUBO_VERSION}"
curl -fLO "${NUBO_RELEASE_URL}/${NUBO_ASSET}"
curl -fLO "${NUBO_RELEASE_URL}/${NUBO_ASSET}.sha256"
```

반입한 파일을 검증·배치한 뒤 출력되는 `apply` 명령을 별도로 실행합니다.

```bash
npm run server:stage -- \
  --archive "$PWD/$NUBO_ASSET" \
  --checksum "$PWD/$NUBO_ASSET.sha256"
```

## Source Mode

스킨이나 NUBO 코드를 자주 바꾸고 프로세스를 직접 관리한다면 소스 checkout을 그대로 실행할 수 있습니다.

```bash
npm install
npm run server:prepare
./goapi-linux
```

`server:prepare`는 공식 bundle을 검증한 뒤 `./goapi-linux`와 `./nubo-market` 링크를 만듭니다. 별도 tmux
창에서 Web을 빌드·실행합니다.

```bash
npm run build
node --env-file="$PWD/.env" .output/server/index.mjs
```

PM2를 쓰면 같은 Node 명령을 PM2 설정에 넣고, 변경 뒤 `npm run build && pm2 restart <앱>`처럼 직접
재시작합니다. tmux도 기존 프로세스를 종료하고 같은 명령을 다시 실행합니다. Market은 이 과정을 대신하지
않으므로 실패 지점과 운영 책임이 분명합니다.

Node `fetch`가 차단된 제한망의 Source Mode에서는 두 릴리스 asset을 반입한 뒤 다음 명령을 사용합니다.

```bash
npm run server:manual -- \
  --archive "$PWD/$NUBO_ASSET" \
  --checksum "$PWD/$NUBO_ASSET.sha256"
npm run build
```

재부팅 자동 시작과 장애 재시작이 중요하면 Source Mode보다 공식 systemd 설치를 권장합니다.

## NUBO Market

Market은 완성된 Web bundle 대신 검증한 스킨 소스를 제공합니다. 따라서 제작자는 독립적으로 스킨을
배포할 수 있고, 사이트 운영자는 설치본을 살펴보거나 일부 수정한 뒤 자신의 NUBO 전체를 다시 빌드합니다.

```bash
./nubo-market search gallery
./nubo-market info nubo-awesome-gallery
./nubo-market install nubo-awesome-gallery
npm run build
```

공식 릴리스 설치에서는 `./nubo-market` 대신 PATH의 `nubo-market`을 사용합니다. 설치와 삭제는 실행 중인
사이트를 바꾸지 않습니다. Source Mode라면 빌드 뒤 현재 Node·PM2·tmux 프로세스를 직접 재시작하세요.

| 명령 | 동작 |
| --- | --- |
| `search`, `info` | 공개 카탈로그 탐색과 호환 버전 확인 |
| `install` | checksum·경로·manifest를 검증해 `app/skins`에 소스 설치 |
| `diff` | 설치 영수증과 현재 파일의 수정·추가·누락 비교 |
| `update` | 로컬 변경이 전혀 없을 때만 새 버전으로 원자적 교체 |
| `fork OLD NEW` | 수정본을 새 key의 사이트 소유 스킨으로 복사 |
| `remove` | 변경이 없는 Market 설치본만 안전하게 삭제 |

업데이트 전에는 새 패키지까지 검증하는 미리보기를 권장합니다.

```bash
./nubo-market diff nubo-awesome-gallery
./nubo-market update nubo-awesome-gallery --dry-run
./nubo-market update nubo-awesome-gallery
npm run build
```

설치본을 수정했다면 update와 remove는 중단됩니다. 수정본을 유지할 때는 fork합니다.

```bash
./nubo-market fork nubo-awesome-gallery my-gallery
```

fork는 `skin.json`에 원본 key·version을 `derived_from`으로 남기고 Market 영수증을 제거합니다. 이후
`my-gallery`의 변경과 버전은 사이트 운영자가 관리합니다. `--force`와 자동 병합은 제공하지 않습니다.

SHA-256은 받은 파일이 Registry 기록과 같다는 뜻이지 코드가 안전하다는 보증은 아닙니다. 스킨 Vue 코드는
NUBO와 같은 브라우저 권한으로 실행되므로 제작자·소스·변경 내역을 확인하고, 중요한 사이트에서는 별도
검토 환경에서 빌드하세요. Market 패키지 자체의 npm script나 임의 의존성은 설치 과정에서 실행하지 않습니다.

## 스킨 개발

기본 스킨은 `app/skins`에 기능별로 나뉘며 다른 스킨 폴더를 직접 import하지 않습니다. 공유 계약은
provider, 타입과 `app/components`의 플랫폼 UI에 둡니다.

새 스킨은 가장 가까운 기본 스킨을 복사하고 폴더명과 `skin.json`의 `key`를 함께 바꿉니다.

```bash
cp -a app/skins/nubo-basic-layout app/skins/my-site-layout
```

Vue·CSS를 수정한 뒤 `npm run typecheck`와 `npm run build`로 확인합니다. Market 배포본은 대표 이미지와
고유 key·semver·최소 NUBO 버전을 포함해야 합니다. 자세한 패키지 계약은 각 기본 스킨 README와
[Market 문서](https://nubohub.org/market/)를 참고하세요.

## 개발

```bash
npm install
npm run server:prepare
./goapi-linux
# 다른 터미널
npm run dev
```

전체 검증 명령은 다음과 같습니다.

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

GOAPI 자체를 수정할 때는 형제 경로에 [GOAPI 저장소](https://github.com/sirini/goapi)를 clone합니다.
공식 Ubuntu 바이너리는 반드시 GOAPI의 `./scripts/build-ubuntu22.sh`로 빌드합니다.

## 설정과 운영

- 전체 환경 변수와 설명: [env.sample](./env.sample)
- API v1 계약: [docs/API_CONTRACT_V1.md](./docs/API_CONTRACT_V1.md)
- 배포 구조와 Nginx 템플릿: [deploy/README.md](./deploy/README.md)
- 기존 v1.2.0 이전 설치 전환: `npm run server:adopt -- --dry-run`, 이후 실제 실행
- 메일: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` 설정 후 GOAPI 재시작
- 가입 정책: `SIGNUP_MODE=verified_email|invite_only|disabled`

`.env`와 `/etc/nubo/nubo.env`에는 DB 비밀번호와 API 키가 들어갑니다. Git에 커밋하거나 공개하지 마세요.
Nginx/TLS는 NUBO 설치 도구가 생성·수정·reload하지 않습니다.

### 기존 첨부 이미지 설명 소급 적용

`OPENAI_IMAGE_DESCRIPTION_ENABLED=true`와 `OPENAI_API_KEY`를 설정한 사이트는 설명이 없는 기존 첨부
이미지를 GPT-5.6 Luna로 한 번씩 처리할 수 있습니다. 먼저 읽기 전용 스캔으로 대상 개수와 비용을 확인합니다.

```bash
python3 scripts/backfill_image_descriptions.py --env-file .env --scan-only
```

공식 prebuilt 설치에서는 릴리스에 포함된 같은 도구를 서비스 계정으로 실행합니다.

```bash
sudo -u nubo python3 /opt/nubo/current/share/tools/backfill_image_descriptions.py \
  --env-file /etc/nubo/nubo.env --scan-only
```

출력된 DB·업로드 경로와 대상 수를 확인하고 외부 백업을 마친 뒤 `--scan-only`를 제거합니다. 스크립트는
2026-08-28 공식 Luna 단가(입력 `$0.20`/100만 토큰, 출력 `$1.20`/100만 토큰)와 보수적인 토큰 상한으로
비용을 안내하고, 운영자가 `진행`을 직접 입력한 뒤에만 이미지 전송과 DB 저장을 시작합니다. `--limit 10`처럼
작은 묶음으로 먼저 시험할 수 있으며, 중단·재실행 시 이미 설명이 있는 이미지는 건너뜁니다. Python 3와
`mysql` 또는 `mariadb` CLI가 필요하고, 실제 가격이 바뀌면 안내된 공식 가격 링크를 확인해
`--input-price`, `--output-price`로 조정합니다.

문제가 생기면 먼저 아래 결과를 확인합니다.

```bash
nuboctl status
nuboctl doctor
curl -fsS http://127.0.0.1:3000/ready
```

## 관련 프로젝트

- [NUBO Market](https://nubohub.org/market/): 스킨 탐색·리뷰·배포 카탈로그
- [GOAPI](https://github.com/sirini/goapi): NUBO 백엔드
- [Sensta Android](https://github.com/sirini/sensta): API v1 Android 참고 구현
- [TSBOARD](https://github.com/sirini/tsboard): NUBO가 계승한 이전 프로젝트

## 라이선스

MIT License
