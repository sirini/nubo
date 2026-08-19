# 🐿️ NUBO

<p align="center">
  <img src="https://img.shields.io/github/v/release/sirini/nubo?style=flat-square&color=E07A5F" alt="release">
  <img src="https://img.shields.io/github/license/sirini/nubo?style=flat-square&color=5D6D7E" alt="license">
  <img src="https://img.shields.io/github/stars/sirini/nubo?style=flat-square&color=F4D03F" alt="stars">
  <img src="https://img.shields.io/github/last-commit/sirini/nubo?style=flat-square&color=2ECC71" alt="last commit">
</p>

NUBO는 사진 커뮤니티, 블로그, 게시판, 동아리 사이트를 한곳에서 만들 수 있는 오픈소스 커뮤니티 빌더입니다. Nuxt 4 기반 웹 화면과 GoFiber v3 기반 [GOAPI](https://github.com/sirini/goapi) 백엔드가 함께 동작하며, MySQL/MariaDB에 데이터를 저장합니다.

현재 버전은 **v1.2.9**입니다. 기본 스킨만으로 바로 운영할 수 있고, `/app/skins` 아래의 스킨을 교체하거나 수정해 사이트의 성격을 바꿀 수 있습니다.

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

### 1. Ubuntu 서버에 설치

- Ubuntu 22.04 이상 x86-64 Linux 서버
- Node.js 22 이상과 npm
- MySQL 8 또는 MariaDB
- 운영 환경에서는 도메인, HTTPS 인증서, Nginx 같은 리버스 프록시
- 기본 포트 `3000`, `3006`을 사용할 수 있는 환경

이 환경에서는 GOAPI 저장소를 따로 clone하거나 Go·컴파일러·libvips를 설치할 필요가 없습니다.
NUBO 저장소의 공식 no-build 설치가 Nuxt와 GOAPI, 이미지 처리 라이브러리, `nuboctl`, systemd unit을
하나의 검증된 릴리스로 내려받습니다. 저장소의 npm 패키지를 설치하거나 서버에서 소스를 빌드하지도 않습니다.

```bash
git clone --depth=1 https://github.com/sirini/nubo.git
cd nubo
npm run server:install
nuboctl activate-nginx
```

`server:install`은 현재 정식 릴리스의 통합 압축본과 SHA-256을 GitHub Releases에서 받아 검증하고,
`/opt/nubo/releases`에 배치한 뒤 그 안의 `nuboctl install`을 실행합니다. sharp-libvips 기반 라이브러리와
이미지 코덱도 같은 압축본에 있으므로 운영 서버에 libvips 패키지를 설치하지 않습니다.

최초 설치와 v1.2.0 이전 사이트 전환 때만 아직 관리 명령이 없으므로 `npm run server:install` 또는
`npm run server:adopt`를 사용합니다. 설치가 끝나면 `/usr/local/bin/nuboctl`이 등록되며 이후에는
다음 명령만 기억하면 됩니다.

```bash
nuboctl status
nuboctl doctor
nuboctl update
nuboctl customize
nuboctl activate-nginx
```

기존 `npm run server:update`, `npm run server:customize`는 자동화 호환을 위해 남아 있지만 새 안내에서는
사용하지 않습니다. `update`와 `customize`는 NUBO 프로젝트 폴더에서 실행해야 합니다.

설치가 끝나면 GOAPI와 Web은 systemd의 `nubo.service`로 함께 관리합니다.

```bash
sudo systemctl status nubo nubo-goapi nubo-web
sudo systemctl restart nubo
sudo journalctl -u nubo-goapi -u nubo-web -f
```

### 2. 소스 개발

화면이나 GOAPI 자체를 수정할 때만 소스 개발 환경을 준비합니다. Ubuntu 22.04 이상 x86-64에서는
MySQL/MariaDB를 먼저 실행한 뒤 공식 GOAPI 런타임을 개발 디렉터리에 받을 수 있습니다.

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
GOAPI_VERSION=1.2.9

GOAPI_PORT=3006
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nubo
DB_TABLE_PREFIX=nubo_
```

`GOAPI_DOMAIN`은 사용자가 접속하는 공개 주소입니다. 운영 서버에서는 `http://localhost`를 그대로 두지 말고 `https://`가 포함된 실제 주소로 변경하세요.

macOS, ARM Linux, Ubuntu가 아닌 Linux에서 개발하려면 `server:prepare`로 받는 Linux x86-64 바이너리 대신
GOAPI를 해당 컴퓨터에서 빌드합니다. Go 1.25 이상, CGO용 C/C++ 컴파일러, pkg-config, libvips 8.14 이상이
필요합니다. macOS에서는 Homebrew로 의존성을 준비할 수 있습니다.

```bash
brew install go pkg-config vips node@22 mysql
export PATH="$(brew --prefix node@22)/bin:$PATH"
brew services start mysql
npm install
git clone https://github.com/sirini/goapi.git ../goapi
cd ../goapi
export CGO_CFLAGS_ALLOW="-Xpreprocessor"
go test ./...
go build -trimpath -o ../nubo/goapi-local ./cmd
cd ../nubo
./goapi-local
```

다른 Linux 배포판도 같은 순서로 빌드하되 패키지 이름은 배포판에 맞게 바꿉니다. Windows에서는 네이티브
GOAPI 빌드보다 WSL2의 Ubuntu 22.04 이상 환경을 권장합니다. WSL2 안에서는 Ubuntu 설치 또는 소스 개발
절차를 그대로 사용하고 Windows 브라우저에서 `http://localhost:3000`에 접속할 수 있습니다. 네이티브
Windows 빌드는 upstream govips가 정기적으로 검증하지 않아 NUBO도 공식 지원하지 않습니다.

플랫폼별 GOAPI 소스 빌드와 실행 방법은 [GOAPI README](https://github.com/sirini/goapi#readme)를 참고하세요.

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

### 4. 직접 빌드 실행

아래 방식은 NUBO 또는 GOAPI 자체를 수정하는 개발·커스텀 운영 환경을 위한 것입니다. 일반 운영 서버는
앞의 `server:install`을 사용하며 서버에서 Nuxt를 다시 빌드하지 않습니다.

```bash
npm run build
node .output/server/index.mjs
```

빌드 서버에서 만든 `.output`만 운영 서버로 옮기는 no-build 배포 PoC와 런타임 환경 변수
계약은 [Prebuilt Nuxt deployment PoC](./docs/PREBUILT_DEPLOYMENT.md)를 참고하세요.

공식 설치에서는 PM2나 tmux로 별도 프로세스를 중복 실행하지 않습니다. 개발 중에는 `./goapi-linux`와
`npm run dev`를 각각 실행하고, 운영에서는 `systemctl restart nubo`로 두 서비스를 함께 관리합니다.

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

공식 prebuilt 운영 환경은 Ubuntu 22.04 이상 x86-64와 Node.js 22 이상입니다. 이후 Ubuntu와 Node.js
버전에는 별도 상한을 두지 않으며 실제 `nuboctl doctor`와 readiness 결과로 실행 가능 여부를 확인합니다.
GOAPI는 Ubuntu 22.04 Docker 환경에서 빌드하고, 내장 libvips로 Ubuntu 22.04/24.04에서 검증합니다.
SSE4.2가 없는 구형 x86-64 CPU에는 호환판을, x86-64-v2 CPU에는 최적화판을 glibc가 자동 선택합니다.
별도 libvips 설치는 필요 없습니다. ARM 서버, 다른 Linux 배포판, macOS, 네이티브 Windows는 공식
prebuilt 운영 범위가 아니지만 공개 소스를 해당 환경에서 빌드해 개발·시험할 수 있습니다.

## 업데이트

### v1.2.0 이전 소스 설치를 새 체제로 전환

기존 프로젝트에서 바로 `git pull`해 전환하기보다, 같은 서버의 옆 경로에 최신 NUBO를 새로 clone한 뒤
환경 파일과 업로드를 옮겨 전환하는 방법을 권장합니다. 아래 예시는 기존 경로가
`/var/www/nubo-old`, 새 경로가 `/var/www/nubo-new`인 경우입니다. 실제 경로는 서버에 맞게 바꾸세요.

먼저 DB와 `upload`를 서버 밖에도 백업합니다. 그다음 기존 NUBO를 실행하던 계정으로 새 clone을 만들고
파일을 복사합니다. 새 프로젝트 디렉터리의 소유자가 이후 systemd 서비스 계정이 되므로, root-only
서버가 아니라면 `sudo git clone`은 사용하지 않는 편이 좋습니다.

```bash
cd /var/www
git clone --depth=1 https://github.com/sirini/nubo.git nubo-new
cp /var/www/nubo-old/.env /var/www/nubo-new/.env
cp -a /var/www/nubo-old/upload /var/www/nubo-new/upload
cd /var/www/nubo-new
```

복사한 `.env`의 `NUBO_UPLOAD_DIR`가 상대 경로이거나 비어 있으면 새 clone의 `upload`를 사용합니다.
절대 경로가 적혀 있으면 그 경로를 계속 사용하므로, 방금 복사한 디렉터리를 쓰려면 값을
`./upload` 또는 새 절대 경로로 바꾸세요. 기존 Nginx의 `location /upload/`에 설정된 `alias`도 같은
경로를 가리켜야 합니다. `server:adopt`는 기존 Nginx/TLS 설정을 자동 수정하거나 reload하지 않습니다.

이제 PM2, tmux, 기존 systemd 또는 수동 명령으로 실행 중인 NUBO 프론트엔드와 GOAPI를 직접
종료합니다. 다른 서비스까지 함께 종료하지 말고 NUBO 프로세스만 내린 뒤 포트 `3000`과 `3006`이
비었는지 확인합니다. 두 포트가 비어 있어야 실제 전환이 시작됩니다.

```bash
sudo ss -ltnp | grep -E ':(3000|3006)\b' || true
npm run server:adopt -- --dry-run
npm run server:adopt
```

새 clone에서는 `server:adopt`를 위해 `npm ci`나 `npm run build`를 실행할 필요가 없습니다. wrapper가
공식 prebuilt 릴리스를 내려받아 검증하기 때문입니다. dry-run은 다운로드한 공식 릴리스와 복사한
`.env`, 실제 사용할 업로드 경로를 검증하고 전체 계획만 보여줍니다. 실제 실행에서는
외부 백업을 완료했다면 안내 문구에서 아무것도 입력하지 않고 Enter를 누릅니다. 다른 문자열을 입력하면
변경 없이 취소합니다. 명령은 다음 원칙으로 동작합니다.

- 기존 프로젝트, `.env`, `upload`, 데이터베이스, Nginx/TLS 설정을 삭제하거나 이동하거나 덮어쓰지 않습니다.
- 기존 `.env` 값을 새 `/etc/nubo/nubo.env` 형식으로 변환하며 원본 참고본도
  `/var/lib/nubo/adoption/legacy.env`에 `0600` 권한으로 보관합니다.
- 기존 프로젝트 소유 계정과 업로드 경로를 새 systemd 서비스에서도 그대로 사용합니다.
- NVM처럼 Node.js가 사용자 홈 아래에 있으면 systemd가 읽을 수 있는 `/opt/nubo/runtime/node`에 현재
  실행 파일을 복사하며, 시스템 경로의 Node.js는 그대로 사용합니다.
- PM2, tmux, systemd 또는 수동 실행 여부를 추측하거나 기존 프로세스를 자동 종료하지 않습니다.
- dry-run에서 포트 `3000`·`3006`의 사용 여부를 안내합니다. 실제 실행은 두 포트가 비어 있지 않으면
  환경 파일·DB·current 링크·systemd 서비스를 변경하기 전에 중단합니다.
- 기존 Nginx와 TLS는 이미 공개 트래픽을 처리하고 있으므로 생성, 수정, reload하지 않습니다.
- DB에는 현재 릴리스의 additive migration을 적용합니다. 이 변경은 자동 rollback하지 않으므로 외부
  백업 확인이 반드시 필요합니다.

포트 `3000`/`3006`을 쓰는 기존 NUBO 프론트엔드와 백엔드는 운영자가 기존 실행 방식에 맞게 직접
종료한 뒤 실제 명령을 다시 실행하면 됩니다. 새 서비스 전환이 실패해도 기존 프로세스를 임의로
재시작하지 않으므로 출력에 따라 이전 실행 방식으로 직접 시작할 수 있습니다. adoption이 끝난 뒤부터는
서버 관리 명령을 `nuboctl`로 통일합니다.
Cafe24처럼 root 계정만 사용하는 기존 서버에서는 root 소유 프로젝트도 adoption할 수 있습니다.
이 경우 실행 계획에 경고를 표시하고 서비스는 root로 실행하지만, systemd의 파일시스템 보호,
권한 상승 차단과 업로드 외 쓰기 경로 제한은 그대로 유지합니다. 일반 계정 운영이 가능하면 해당 계정을
사용하는 편을 권장하지만 필수 조건은 아닙니다.

전환이 끝나면 전체 서비스는 다음처럼 관리합니다.

```bash
sudo systemctl restart nubo
sudo systemctl status nubo nubo-goapi nubo-web
```

#### 커스텀 Vue 스킨을 사용하던 사이트

`app/skins` 아래의 Vue 스킨과 `skin.json`은 런타임 플러그인이 아니라 Nuxt 빌드에 포함되는 소스입니다.
커스텀 스킨 폴더는 새 clone의 같은 위치에 복사합니다.

```bash
cp -a /var/www/nubo-old/app/skins/my-custom-skin /var/www/nubo-new/app/skins/
cd /var/www/nubo-new
```

adoption을 마친 뒤에는 아래의 `nuboctl customize`로 로컬 스킨을 공식 릴리스와 결합할 수 있습니다.
명령이 의존성 설치, typecheck, production build, 파생 릴리스 checksum 생성, Web 재시작과 readiness
검사를 수행합니다. 실패하면 이전 Web 빌드로 자동 복구하며 GOAPI, DB, 업로드, 환경 파일과 Nginx는
변경하지 않습니다.

```bash
cd /var/www/nubo-new
nuboctl customize
```

첫 실행이나 `package-lock.json`이 바뀐 경우에만 `npm ci`를 자동 실행하고, 이후 문구·스타일 수정에는
준비된 의존성을 재사용합니다. 전환 전에 계획만 확인하려면 `--dry-run`을 붙일 수 있습니다. 이 경우에도
빌드와 파생 릴리스 검증은 수행하지만 실행 중인 서비스는 바꾸지 않습니다.

저사양 가상 CPU에서 Vite 8의 변환 작업이 멈추는 문제를 피하기 위해 현재 lockfile은
`rolldown-vite@7.3.1`을 호환 빌더로 고정합니다. 운영자가 Vite를 따로 설치하거나 `NODE_OPTIONS`를
지정할 필요는 없습니다. 다만 빌드 중 메모리 부족으로 프로세스가 종료되는 서버라면 swap이나 약 3GB
이상의 사용 가능한 메모리를 준비해야 합니다.

```bash
nuboctl customize --dry-run
```

공식 prebuilt 디렉터리는 여전히 직접 수정하면 안 됩니다. 커스텀 결과는
`/opt/nubo/releases/<버전>-site-<해시>`라는 별도 불변 릴리스로 배치되고 `current` 링크만 원자적으로
전환됩니다.

### v1.2.2 이후 공식 서버 설치 업데이트

공식 서버 설치는 DB와 업로드의 외부 백업을 마친 뒤 저장소의 릴리스 채널을 갱신하고 한 명령으로 업데이트합니다.

```bash
git pull --ff-only
nuboctl update --dry-run
nuboctl update
```

명령은 새 통합 릴리스를 내려받아 검증·배치한 뒤 백업 확인, additive migration,
원자적 `current` 전환, 재시작과 readiness 검사를 그대로 수행합니다. 소스 개발 환경에서 GOAPI만
갱신하려면 `npm run server:prepare`를 다시 실행합니다.

사이트 전용 로컬 스킨을 사용 중이라면 공식 업데이트 직후에는 기본 prebuilt Web이 실행됩니다.
현재 버전에서는 로컬 스킨을 자동으로 다시 빌드하지 않으므로, 업데이트가 정상 완료된 뒤 새 소스와의
호환성을 확인하며 `nuboctl customize`를 한 번 더 실행합니다. 이 명령은 방금 설치한 공식 버전을
기반으로 사이트 전용 Web을 다시 만들고 Web만 전환합니다.

v1.2.7까지 adoption을 마친 서버는 v1.2.8로 update해도 systemd 구성을 자동 변경하지 않습니다.
짧은 대표 명령을 원할 때만 다음 절차를 한 번 실행합니다. 실행 중인 GOAPI와 Web은 이 과정에서
재시작되지 않으며 내부 `nubo.target` 파일은 삭제하지 않습니다.

```bash
sudo install -m 0644 /opt/nubo/current/share/systemd/nubo.service /etc/systemd/system/nubo.service
sudo systemctl daemon-reload
sudo systemctl disable nubo.target
sudo systemctl enable --now nubo.service
```

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
- 새 스킨을 만들 때 기본 스킨을 직접 수정하지 말고 폴더를 복사한 뒤 `skin.json`의 `key`, 이름과 버전을
  새 폴더에 맞게 바꾸는 방식을 권장합니다. 그래야 `git pull`과 공식 스킨 업데이트가 사이트 수정을
  덮어쓰지 않습니다.
- 설치된 서버에서는 수정 후 `nuboctl customize` 한 명령으로 빌드·검증·적용합니다.

예를 들어 사이트 전용 레이아웃과 홈을 만들려면 기본 폴더를 새 key로 복사합니다.

```bash
cp -a app/skins/nubo-basic-layout app/skins/my-site-layout
cp -a app/skins/nubo-basic-home app/skins/my-site-home
```

각 폴더의 `skin.json`에서 `key`를 각각 `my-site-layout`, `my-site-home`으로 바꾸고 이름·버전·제작자
정보를 수정합니다. Vue 파일의 문구·구조·버튼 스타일을 사이트에 맞게 편집한 뒤 적용합니다.

```bash
nuboctl customize
```

빌드가 적용되면 관리 화면의 레이아웃과 홈 선택 목록에서 새 스킨을 골라 **적용하기**를 누릅니다.
이미 선택한 사이트 전용 스킨을 다시 수정한 경우에는 같은 명령만 재실행하면 됩니다.

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
