# 🐿️ NUBO

<p align="center">
  <img src="https://img.shields.io/github/v/release/sirini/nubo?style=flat-square&color=E07A5F" alt="release">
  <img src="https://img.shields.io/github/license/sirini/nubo?style=flat-square&color=5D6D7E" alt="license">
  <img src="https://img.shields.io/github/stars/sirini/nubo?style=flat-square&color=F4D03F" alt="stars">
  <img src="https://img.shields.io/github/last-commit/sirini/nubo?style=flat-square&color=2ECC71" alt="last commit">
</p>

NUBO는 사진 커뮤니티, 블로그, 게시판, 동아리 사이트를 한곳에서 만들 수 있는 오픈소스 커뮤니티 빌더입니다. Nuxt 4 기반 웹 화면과 GoFiber v3 기반 [GOAPI](https://github.com/sirini/goapi) 백엔드가 함께 동작하며, MySQL/MariaDB에 데이터를 저장합니다.

현재 버전은 **v1.2.3**입니다. 기본 스킨만으로 바로 운영할 수 있고, `/app/skins` 아래의 스킨을 교체하거나 수정해 사이트의 성격을 바꿀 수 있습니다.

## 어떤 프로젝트인가요?

- 게시판, 갤러리, 블로그, 웹진, 중고거래 게시판을 제공합니다.
- Nuxt SSR을 사용해 공개 게시물의 검색 엔진 노출과 초기 표시 속도를 고려합니다.
- 회원가입, 비밀번호 초기화, 댓글 알림 메일을 Resend로 보낼 수 있습니다.
- 관리자가 Markdown으로 단체 메일을 작성하고 미리보기·테스트 발송 후 회원에게 보낼 수 있습니다.
- 가입 정책을 이메일 인증, 초대 전용, 가입 중지 중에서 선택할 수 있습니다.
- TSBOARD 데이터베이스 구조와의 호환성을 유지합니다.

## 구성 이해하기

NUBO는 두 프로세스로 실행됩니다.

| 구성 | 기본 포트 | 역할 |
| --- | ---: | --- |
| Nuxt/Nitro | `3000` | 화면 렌더링, 브라우저 API 중계, 인증 쿠키 관리 |
| GOAPI | `3006` | 데이터베이스, 회원·게시물·메일·파일 처리 |

소스 개발에서는 두 프로세스가 같은 프로젝트 디렉터리의 `.env` 설정을 사용합니다. `npm run server:prepare`가 공식 통합 릴리스에서 GOAPI와 libvips를 함께 내려받고 기존 `./goapi-linux` 실행 경로를 준비합니다. Prebuilt 배포에서는 같은 형식의 파일을 `/etc/nubo/nubo.env`처럼 릴리스 밖에 두고 GOAPI에는 `NUBO_ENV_FILE`로, Node에는 `--env-file`로 명시합니다.
Prebuilt의 `nuboctl install`은 이 외부 설정을 이용해 DB와 최초 관리자까지 준비하므로 운영 서버에서 npm 설치나 Nuxt 빌드를 반복하지 않습니다.

> `.env`에는 DB 비밀번호와 API 키가 들어갑니다. Git에 커밋하거나 외부에 공개하지 마세요.

## 빠른 설치

### 1. 준비물

- Ubuntu 22.04 이상 x86-64 Linux 서버(WSL2 포함). 다른 아키텍처는 GOAPI를 직접 빌드해야 합니다.
- Node.js 22 이상과 npm
- MySQL 8 또는 MariaDB
- GOAPI 소스를 직접 수정하고 빌드할 때만 이미지 처리를 위한 `libvips-dev`
- 운영 환경에서는 도메인, HTTPS 인증서, Nginx 같은 리버스 프록시
- 기본 포트 `3000`, `3006`을 사용할 수 있는 환경

공식 no-build 서버 설치에는 저장소의 npm 패키지를 설치할 필요가 없습니다.

```bash
git clone --depth=1 https://github.com/sirini/nubo.git
cd nubo
npm run server:install
sudo /opt/nubo/current/nuboctl activate-nginx
```

`server:install`은 현재 릴리스 후보의 통합 압축본과 SHA-256을 GitHub Releases에서 받아 검증하고,
`/opt/nubo/releases`에 배치한 뒤 그 안의 `nuboctl install`을 실행합니다. sharp-libvips 기반 라이브러리와
이미지 코덱도 같은 압축본에 있으므로 운영 서버에 libvips 패키지를 설치하지 않습니다.

### 2. 소스 개발

화면과 GOAPI를 수정할 때만 npm 의존성을 설치합니다. MySQL/MariaDB를 먼저 실행하고 GOAPI를 준비합니다.

```bash
npm install
npm run server:prepare
./goapi-linux
```

화면의 질문에 DB 접속 정보와 최초 관리자 이메일·비밀번호를 입력하면 다음 작업이 이루어집니다.

1. `.env` 생성
2. 데이터베이스와 기본 테이블 생성
3. 관리자 계정 생성
4. GOAPI 실행

설치가 끝나면 `.env`에서 아래 값은 반드시 운영 환경에 맞게 확인하세요.

```dotenv
GOAPI_DOMAIN=https://example.com
GOAPI_TITLE=My NUBO
GOAPI_VERSION=1.2.3

GOAPI_PORT=3006
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nubo
DB_TABLE_PREFIX=nubo_
```

`GOAPI_DOMAIN`은 사용자가 접속하는 공개 주소입니다. 운영 서버에서는 `http://localhost`를 그대로 두지 말고 `https://`가 포함된 실제 주소로 변경하세요.

### 3. 개발 서버에서 확인

GOAPI를 실행한 상태에서 별도 터미널을 열어 Nuxt를 시작합니다.

```bash
npm run dev
```

기본 접속 주소는 `http://localhost:3000`입니다. 로컬 환경에서는 Resend 메일보다 화면과 게시판 기능을 먼저 확인하는 것이 편합니다.

### 개발 검증

```bash
npm test
npm run test:unit
npm run test:nuxt
npm run typecheck
npm run build
```

`npm test`는 빠른 Node 단위 테스트와 Nuxt 런타임 테스트를 모두 실행합니다. 브라우저 E2E와 테스트 DB는 다음 테스트 하네스 단계에서 별도로 추가합니다.

### 4. 운영 빌드

```bash
npm run build
node .output/server/index.mjs
```

빌드 서버에서 만든 `.output`만 운영 서버로 옮기는 no-build 배포 PoC와 런타임 환경 변수
계약은 [Prebuilt Nuxt deployment PoC](./docs/PREBUILT_DEPLOYMENT.md)를 참고하세요.

소스 개발 환경에서 PM2로 직접 실행할 수도 있지만 공식 서버 설치는 `nuboctl`이 만든 systemd unit을 사용합니다.

```bash
pm2 start .output/server/index.mjs --name nubo-web
pm2 start ./goapi-linux --name nubo-api
pm2 save
```

프런트엔드만 PM2 클러스터 모드로 늘릴 수 있습니다. GOAPI는 단일 프로세스로도 여러 요청을 동시에 처리하므로 특별한 이유가 없다면 하나만 실행하는 것을 권장합니다.

## 메일과 회원가입 설정

NUBO의 메일 제공자는 **Resend 하나만 사용**합니다. Gmail 앱 비밀번호나 SMTP 설정은 사용하지 않습니다.

1. [Resend](https://resend.com)에서 계정을 만들고 발신 도메인을 등록합니다.
2. Resend가 안내하는 SPF/DKIM DNS 레코드를 도메인의 DNS 관리 화면에 그대로 등록합니다.
3. 도메인이 `Verified`가 되면 API 키를 만들고 `.env`를 설정합니다.
4. GOAPI를 다시 시작한 뒤 `관리자 → 대시보드 → 이메일 설정 안내`에서 상태를 확인합니다.

```dotenv
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=noreply@example.com
RESEND_FROM_NAME=My NUBO
RESEND_REPLY_TO_EMAIL=admin@example.com
```

- `RESEND_FROM_EMAIL`은 Resend에서 인증한 도메인의 주소여야 합니다. 실제 메일함이 없어도 발신 전용 주소로 사용할 수 있습니다.
- `RESEND_REPLY_TO_EMAIL`은 선택 사항이며, 답장을 받을 Gmail 등 개인 메일 주소도 사용할 수 있습니다.
- 단체 메일까지 사용하려면 연락처·세그먼트·Broadcast를 만들 수 있는 Resend API 키 권한이 필요합니다.
- 무료 플랜 한도와 정책은 변경될 수 있으므로 실제 발송 전 [Resend 요금 안내](https://resend.com/pricing)를 확인하세요.

관리자 메일 화면은 회원가입 인증, 비밀번호 초기화, 댓글 알림의 발송 요청 이력을 NUBO 데이터베이스에 자체 보관합니다. 최근 30일 요약과 전체 기록을 페이지별로 볼 수 있으며 Resend의 조회 API나 웹훅에는 의존하지 않습니다. `발송 요청 완료`는 제공자가 요청을 접수했다는 뜻으로 실제 수신함 도착을 보장하지는 않으며, 메일 본문과 인증 코드는 저장하지 않습니다.

가입 정책은 다음 중 하나입니다.

```dotenv
# verified_email | invite_only | disabled
SIGNUP_MODE=verified_email
```

| 값 | 동작 |
| --- | --- |
| `verified_email` | 기본값. Resend 이메일 인증 또는 설정된 소셜 로그인의 인증된 이메일로 가입합니다. |
| `invite_only` | 관리자가 발급한 이메일별 초대 링크가 있어야 가입됩니다. |
| `disabled` | 신규 가입을 즉시 중지합니다. |

Resend를 설정하지 않았다면 일반 이메일 가입은 완료할 수 없지만, 설정된 Google 등 소셜 로그인으로는 신규 가입할 수 있습니다. `invite_only`와 `disabled`에서는 신규 소셜 가입도 차단되며 기존 회원의 소셜 로그인은 유지됩니다. 작은 비공개 사이트라면 `invite_only`를 선택하고 관리자 화면에서 초대를 발급할 수 있습니다.

## 선택 환경 변수

- `OAUTH_GOOGLE_*`, `OAUTH_NAVER_*`, `OAUTH_KAKAO_*`: 소셜 로그인 사용 시 설정
- `OPENAI_API_KEY`: OpenAI 연동 자격 증명. 키만 설정해도 AI 기능은 활성화되지 않음
- `OPENAI_IMAGE_DESCRIPTION_ENABLED`: 업로드 이미지 설명 생성을 명시적으로 활성화 (`false`가 기본값)
- `OPENAI_IMAGE_DESCRIPTION_MODEL`: 이미지 입력을 지원하는 모델 ID (`gpt-5.6-luna`가 기본값)
- `OPENAI_IMAGE_DESCRIPTION_MAX_PER_POST`, `OPENAI_IMAGE_DESCRIPTION_CONCURRENCY`: 게시글당 생성 수와 서버 전체 동시 호출 상한
- `SYNC_SECRET_KEY`: 외부 게시물 동기화 API 전용 비밀키. 자동 생성되며 공개하면 안 됨
- 이미지 크기와 업로드 제한은 `GOAPI_*_SIZE`, `GOAPI_FILE_SIZE_LIMIT`로 조정

전체 항목과 설명은 [env.sample](./env.sample)을 참고하세요.

공식 릴리스의 기준 환경은 Ubuntu 22.04와 Node.js 22입니다. 이후 Ubuntu와 Node.js 버전에는 별도 상한을 두지 않으며 실제 `nuboctl doctor`와 readiness 결과로 실행 가능 여부를 확인합니다. GOAPI는 Ubuntu 22.04 Docker 환경에서 빌드하고, 내장 libvips로 Ubuntu 22.04/24.04에서 검증합니다. SSE4.2가 없는 구형 x86-64 CPU에는 호환판을, x86-64-v2 CPU에는 최적화판을 glibc가 자동 선택합니다. 별도 libvips 설치는 필요 없으며 ARM 서버나 다른 Linux 계열은 현재 지원 범위가 아닙니다.

## 업데이트

### v1.2.0 이전 소스 설치를 새 체제로 전환

기존에 프로젝트 디렉터리에서 Nuxt와 `goapi-linux`를 직접 빌드하고 PM2로 실행했다면, 먼저 DB와
`upload` 디렉터리를 서버 밖에 백업한 뒤 다음 두 명령으로 전환할 수 있습니다.

```bash
git pull --ff-only
npm run server:adopt -- --dry-run
npm run server:adopt
```

dry-run은 다운로드한 공식 릴리스와 기존 `.env`를 검증하고 전체 계획만 보여줍니다. 실제 실행에서는
백업을 완료했다는 뜻으로 `BACKUP`을 직접 입력해야 합니다. 명령은 다음 원칙으로 동작합니다.

- 기존 프로젝트, `.env`, `upload`, 데이터베이스, Nginx/TLS 설정을 삭제하거나 이동하거나 덮어쓰지 않습니다.
- 기존 `.env` 값을 새 `/etc/nubo/nubo.env` 형식으로 변환하며 원본 참고본도
  `/var/lib/nubo/adoption/legacy.env`에 `0600` 권한으로 보관합니다.
- 기존 프로젝트 소유 계정과 업로드 경로를 새 systemd 서비스에서도 그대로 사용합니다.
- NVM처럼 Node.js가 사용자 홈 아래에 있으면 systemd가 읽을 수 있는 `/opt/nubo/runtime/node`에 현재
  실행 파일을 복사하며, 시스템 경로의 Node.js는 그대로 사용합니다.
- 표준 PM2 앱 이름인 `nubo-web`, `nubo-api`만 중지하고 systemd로 전환합니다. 새 서비스가 준비되지
  않으면 기존 PM2 앱의 재시작을 시도합니다.
- 기존 Nginx와 TLS는 이미 공개 트래픽을 처리하고 있으므로 생성, 수정, reload하지 않습니다.
- DB에는 현재 릴리스의 additive migration을 적용합니다. 이 변경은 자동 rollback하지 않으므로 외부
  백업 확인이 반드시 필요합니다.

다른 PM2 이름이나 수동 실행 프로세스가 포트 `3000`/`3006`을 쓰고 있으면 명령은 새 서비스를 설치하기
전에 중단합니다. 해당 프로세스를 운영자가 종료한 뒤 다시 실행하면 됩니다. adoption이 끝난 뒤부터는
프로젝트 소스에서 빌드하지 않고 아래의 `server:update`를 사용합니다.
프로젝트가 `root` 소유이면 애플리케이션을 root 권한으로 옮겨 실행하지 않고 안전하게 중단하므로, 먼저
프로젝트와 업로드 디렉터리를 운영할 일반 계정의 소유권을 확인해야 합니다.

### v1.2.2 이후 공식 서버 설치 업데이트

공식 서버 설치는 DB와 업로드의 외부 백업을 마친 뒤 저장소의 릴리스 채널을 갱신하고 한 명령으로 업데이트합니다.

```bash
git pull --ff-only
npm run server:update
```

명령은 새 통합 릴리스를 내려받아 검증·배치한 뒤 `nuboctl update`의 백업 확인, additive migration,
원자적 `current` 전환, 재시작과 readiness 검사를 그대로 수행합니다. 소스 개발 환경에서 GOAPI만
갱신하려면 `npm run server:prepare`를 다시 실행합니다.

## Nginx 예시

아래 예시는 Nuxt를 공개하고, OAuth 콜백용 GOAPI 경로와 업로드 파일을 연결합니다. 인증서 경로와 프로젝트 경로는 자신의 서버에 맞게 바꾸세요.

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /goapi/ {
        proxy_pass http://127.0.0.1:3006/goapi/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /upload/ {
        alias /var/www/nubo/upload/;
        autoindex off;
    }
}
```

Cloudflare 같은 프록시를 추가로 사용한다면 원래 요청이 HTTPS였다는 정보가 `X-Forwarded-Proto`로 전달되는지 확인하세요.

## 스킨 개발

- 기본 스킨은 `/app/skins` 아래에 기능별로 나뉘어 있습니다.
- 공통 UI는 Vue 3, Tailwind CSS, shadcn-vue 구성요소를 사용합니다.
- 복잡한 데이터 처리는 composable/provider에 두고 스킨에서는 필요한 상태와 동작만 가져오는 구조를 지향합니다.
- 새 스킨을 만들 때 기본 스킨을 복사한 뒤 이름과 스타일을 바꾸는 방식으로 시작할 수 있습니다.

## 문제를 확인할 때

- 화면이 API에 연결되지 않으면 Nuxt와 GOAPI가 모두 실행 중인지, `.env`의 포트와 `GOAPI_BASE`가 일치하는지 확인합니다.
- 이미지가 보이지 않으면 `upload` 경로의 권한과 Nginx `alias`를 확인합니다.
- 메일이 오지 않으면 관리자 이메일 설정 화면, Resend 도메인 상태, 발신 주소의 도메인을 차례로 확인합니다.
- 공식 설치를 업데이트한 뒤 DB 오류가 나면 `/opt/nubo/current/nuboctl status`와 `doctor` 결과를 확인합니다.
- 추가 도움이 필요하면 [nubohub.org](https://nubohub.org)에서 문의해 주세요.

## 관련 프로젝트

- [GOAPI](https://github.com/sirini/goapi): NUBO 백엔드
- [TSBOARD](https://github.com/sirini/tsboard): NUBO가 계승한 이전 프로젝트

## 라이선스

MIT License
