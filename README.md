# 🐿️ NUBO

NUBO는 사진 커뮤니티, 블로그, 게시판과 사내 커뮤니티를 만드는 오픈소스 커뮤니티 빌더입니다.
Nuxt 4 웹, [GOAPI](https://github.com/sirini/goapi), MySQL/MariaDB를 함께 사용합니다.

> 현재 버전: NUBO/GOAPI 1.3.1 · 지원 runtime: Ubuntu 22.04+ Linux amd64, Node.js 22+

## 주요 기능

- 게시판, 사진 갤러리, 블로그, 웹진과 중고거래형 게시판
- SSR 기반 공개 게시물과 반응형 light/dark UI
- 회원·권한·댓글·알림·채팅·사진 업로드
- 이메일 인증, 초대 가입, 비밀번호 초기화와 소셜 로그인
- 독립적인 소스 스킨과 [NUBO Market](https://nubohub.org/market/)
- AI 이미지 설명과 설명·해시태그 통합 검색

## 운영 원칙

NUBO는 소스 checkout을 운영자가 직접 빌드하고 tmux 또는 PM2 등 익숙한 방식으로 실행하는 Source Mode를
기본으로 합니다. 새 `./bin/nubo`는 다음 경계만 책임집니다.

- 현재 checkout과 맞는 공식 GOAPI·libvips 다운로드 및 검증
- 현재 checkout과 맞는 NUBO CLI 자체 업데이트
- `skins/<key>` 단위의 Market 검색·설치와 향후 제작자 게시
- 실행 전에 변경 대상과 출처를 보여주고, 완료 뒤 운영자가 할 일을 안내

Git 변경, npm 설치, Nuxt 빌드, DB migration과 프로세스 시작·중지·재시작은 자동으로 수행하지 않습니다.
Nginx와 TLS도 운영자가 관리합니다.

## 시작하기

```bash
git clone https://github.com/sirini/nubo.git
cd nubo
cp env.sample .env
```

`.env`에 DB 접속 정보, 사이트 이름, 관리자 계정과 JWT 비밀값을 설정합니다. 비밀값이 들어간 `.env`는
Git에 커밋하지 마세요.

공식 runtime을 먼저 검증합니다.

```bash
./bin/nubo download --dry-run
./bin/nubo download
```

첫 실행에는 tracked launcher가 `nubo-linux-amd64`와 SHA-256을 검증해 `.nubo/bin/nubo`에 준비합니다.
`download`는 checkout의 `deploy/release-sources.json`에 고정된 runtime만 허용하고 다음 파일을 설치합니다.

```text
bin/goapi
lib/*
licenses/sharp-libvips/*
.nubo/runtime.json
```

새 DB를 준비하는 최초 설치에서만 다음 명령을 실행합니다. 기존 사이트 migration은 서버 밖의 DB·업로드
백업과 릴리스 안내를 먼저 확인하세요.

```bash
./bin/goapi install
```

Web 의존성을 설치하고 빌드합니다.

```bash
npm install
npm run build
```

두 프로세스를 별도 tmux 창에서 실행하는 예입니다.

```bash
./bin/goapi
node --env-file=.env .output/server/index.mjs
```

PM2를 사용한다면 같은 두 명령을 기존 PM2 설정에 등록합니다. NUBO는 운영자의 프로세스 관리 방식을
감지하거나 변경하지 않습니다.

## Runtime 갱신

소스와 runtime의 조합은 descriptor가 고정합니다.

```bash
git pull --ff-only
./bin/nubo update --dry-run
./bin/nubo update
./bin/nubo download --dry-run
./bin/nubo download
npm install
npm run build
```

완료 화면에 DB migration 필요 여부와 운영자가 수행할 재시작 단계가 표시됩니다. `nubo download` 자체는
DB, Web build와 실행 중인 GOAPI·Node 프로세스를 건드리지 않습니다.

자동화에서는 다음 옵션을 사용할 수 있습니다.

```bash
./bin/nubo update --plain --json
./bin/nubo download --yes --plain
./bin/nubo download --yes --json
```

## CLI 디자인과 접근성

TTY에서는 Bubble Tea 기반의 warm-tone 진행 화면을 사용합니다. 파이프·CI에서는 자동으로 평문 출력으로
전환하며 `NO_COLOR`, `--plain`, `--json`을 지원합니다. Ctrl+C로 취소하면 검증 중인 임시 파일만 정리하고
기존 runtime은 유지합니다.

자세한 계약은 [NUBO CLI 문서](./docs/NUBO_CLI.md)를 참고하세요.

## NUBO Market

Market은 완성된 Web bundle이 아니라 검토 가능한 스킨 소스를 배포합니다. v1.3.1 CLI는 공개 package를
검색·설치하고, 로컬 스킨을 Market 계약에 맞춰 검증·패키징합니다. 인증·게시 흐름은 v1.4에서 활성화합니다.

```text
./bin/nubo search gallery
./bin/nubo info skins/nubo-advance-gallery
./bin/nubo install skins/nubo-advance-gallery
./bin/nubo install skins/nubo-advance-gallery --dry-run
./bin/nubo validate skins/my-gallery
./bin/nubo pack skins/my-gallery
```

설치는 Market SHA-256, manifest, 압축 경로와 파일별 영수증을 검증합니다. 기존 Market 설치는 로컬 변경이
없을 때만 새 버전으로 원자적으로 교체하며, 직접 만든 폴더나 수정된 스킨은 덮어쓰지 않습니다. CLI는
설치 뒤 Nuxt build와 Web 프로세스 재시작을 자동 실행하지 않습니다.

`validate`는 `skin.json`, 지원 Vue entry, 이미지와 파일 수·크기·경로 한계를 실제 Market 계약으로
검사합니다. `pack`은 같은 검증을 통과한 소스만 재현 가능한 tar.gz로 만들며 업로드나 publish는 하지
않습니다.

현재 스킨은 `app/skins`에서 직접 개발할 수 있습니다. 스킨끼리 다른 스킨 폴더를 import하지 않으며 공유
경계는 provider, 타입과 `app/components`의 플랫폼 UI입니다.

```bash
cp -a app/skins/nubo-basic-layout app/skins/my-site-layout
npm run typecheck
npm run build
```

## 개발

Frontend 개발:

```bash
npm install
npm run dev
```

검증:

```bash
npm test
npm run lint
npm run typecheck
npm run build
(cd tools/nubo && go test ./... && go vet ./...)
```

GOAPI를 수정할 때는 형제 경로에 [GOAPI 저장소](https://github.com/sirini/goapi)를 clone합니다. 공식 Linux
runtime은 반드시 GOAPI의 `./scripts/build-ubuntu22.sh`를 통해 빌드합니다.

## 기본 포트와 상태 확인

| 구성 | 기본 포트 | 역할 |
| --- | ---: | --- |
| Nuxt/Nitro | `3000` | SSR, 브라우저 API 중계, 인증 쿠키 |
| GOAPI | `3006` | DB, 회원·게시물·메일·파일 처리 |

```bash
curl -fsS http://127.0.0.1:3000/ready
curl -fsS http://127.0.0.1:3006/health
```

## 관련 문서와 프로젝트

- [환경 변수 예시](./env.sample)
- [API contract v1](./docs/API_CONTRACT_V1.md)
- [NUBO Market](https://nubohub.org/market/)
- [GOAPI](https://github.com/sirini/goapi)
- [Sensta Android](https://github.com/sirini/sensta)

## 라이선스

MIT License
