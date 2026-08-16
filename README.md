# 🐿️ NUBO

<p align="center">
  <img src="https://img.shields.io/github/v/release/sirini/nubo?style=flat-square&color=E07A5F" alt="release">
  <img src="https://img.shields.io/github/license/sirini/nubo?style=flat-square&color=5D6D7E" alt="license">
  <img src="https://img.shields.io/github/stars/sirini/nubo?style=flat-square&color=F4D03F" alt="stars">
  <img src="https://img.shields.io/github/last-commit/sirini/nubo?style=flat-square&color=2ECC71" alt="last commit">
</p>

NUBO는 사진 커뮤니티, 블로그, 게시판, 동아리 사이트를 한곳에서 만들 수 있는 오픈소스 커뮤니티 빌더입니다. Nuxt 4 기반 웹 화면과 GoFiber v3 기반 [GOAPI](https://github.com/sirini/goapi) 백엔드가 함께 동작하며, MySQL/MariaDB에 데이터를 저장합니다.

현재 버전은 **v1.2.1**입니다. 기본 스킨만으로 바로 운영할 수 있고, `/app/skins` 아래의 스킨을 교체하거나 수정해 사이트의 성격을 바꿀 수 있습니다.

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

두 프로세스는 같은 프로젝트 디렉터리의 `.env`를 읽습니다. 저장소에 포함된 `goapi-linux`를 처음 실행하면 `env.sample`을 바탕으로 `.env`와 데이터베이스를 생성합니다.

> `.env`에는 DB 비밀번호와 API 키가 들어갑니다. Git에 커밋하거나 외부에 공개하지 마세요.

## 빠른 설치

### 1. 준비물

- x86-64 Linux 서버(WSL2 포함). 다른 아키텍처는 GOAPI를 직접 빌드해야 합니다.
- Node.js 24 LTS 이상과 npm
- MySQL 8 또는 MariaDB
- 이미지 처리를 위한 `libvips` (`libvips-dev` 패키지)
- 운영 환경에서는 도메인, HTTPS 인증서, Nginx 같은 리버스 프록시
- 기본 포트 `3000`, `3006`을 사용할 수 있는 환경

Ubuntu 계열의 예시는 다음과 같습니다.

```bash
sudo apt update
sudo apt install libvips-dev
git clone https://github.com/sirini/nubo.git
cd nubo
npm install
```

### 2. 최초 설치와 `.env` 생성

MySQL/MariaDB를 먼저 실행하고, NUBO 디렉터리에서 GOAPI를 실행합니다.

```bash
chmod +x ./goapi-linux
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
GOAPI_VERSION=1.2.1

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

### 4. 운영 빌드

```bash
npm run build
node .output/server/index.mjs
```

장기 운영 시 systemd 또는 PM2로 두 프로세스를 관리할 수 있습니다.

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

가입 정책은 다음 중 하나입니다.

```dotenv
# verified_email | invite_only | disabled
SIGNUP_MODE=verified_email
```

| 값 | 동작 |
| --- | --- |
| `verified_email` | 기본값. Resend 이메일 인증을 완료해야 가입됩니다. |
| `invite_only` | 관리자가 발급한 이메일별 초대 링크가 있어야 가입됩니다. |
| `disabled` | 신규 가입을 즉시 중지합니다. |

Resend를 설정하지 않았다면 `verified_email` 가입은 완료할 수 없습니다. 작은 비공개 사이트라면 먼저 `invite_only`를 선택하고 관리자 화면에서 초대를 발급하는 방식을 권장합니다.

## 선택 환경 변수

- `OAUTH_GOOGLE_*`, `OAUTH_NAVER_*`, `OAUTH_KAKAO_*`: 소셜 로그인 사용 시 설정
- `OPENAI_API_KEY`: 업로드 이미지 설명 생성 기능에 사용하며 없어도 기본 기능은 동작
- `SYNC_SECRET_KEY`: 외부 게시물 동기화 API 전용 비밀키. 자동 생성되며 공개하면 안 됨
- 이미지 크기와 업로드 제한은 `GOAPI_*_SIZE`, `GOAPI_FILE_SIZE_LIMIT`로 조정

전체 항목과 설명은 [env.sample](./env.sample)을 참고하세요.

## 업데이트

업데이트 전에는 `.env`, 데이터베이스, `upload` 디렉터리를 백업하세요.

```bash
git pull --ff-only
npm install
./goapi-linux install
npm run build
```

`./goapi-linux install`은 새 테이블과 컬럼을 반복 실행해도 안전하게 반영하는 명령입니다. 업데이트 후에는 Nuxt와 GOAPI 프로세스를 모두 다시 시작하세요.

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
- 기존 설치를 업데이트한 뒤 DB 오류가 나면 `./goapi-linux install`을 실행합니다.
- 추가 도움이 필요하면 [nubohub.org](https://nubohub.org)에서 문의해 주세요.

## 관련 프로젝트

- [GOAPI](https://github.com/sirini/goapi): NUBO 백엔드
- [TSBOARD](https://github.com/sirini/tsboard): NUBO가 계승한 이전 프로젝트

## 라이선스

MIT License
