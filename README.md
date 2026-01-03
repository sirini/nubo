# 🌌 Nubo

Nuxt 4와 GoFiber v3 조합으로 다시 태어난 커뮤니티/웹사이트 빌더입니다. TSBOARD의 자산을 그대로 계승하면서 SSR(Server Side Rendering)을 통한 SEO(Search Engine Optimization), 스킨 기반 UI 커스터마이징, 개선된 검색·페이징 경험을 한 번에 제공합니다.

## 주요 강점

- **개선된 백엔드 엔진**: TSBOARD에서 검증된 GoFiber v3 기반 엔진을 한층 다듬어 높은 성능과 안정성을 제공합니다. 백엔드 코드는 별도로 진행중인 GOAPI([sirini/goapi](https://github.com/sirini/goapi)) 프로젝트를 기반으로 합니다.
- **스킨 시스템 내장**: 전체 레이아웃부터 게시판·로그인 화면까지 스킨만 교체하면 즉시 테마가 바뀝니다. 제로보드4/그누보드5 감성을 모던 웹에서 재현하면서도 shadcn-vue + Tailwind CSS 조합으로 새로운 스킨 개발을 더 쉽고 빠르게 해보실 수 있습니다.
- **DB 호환성 유지**: TSBOARD에서 사용하던 DB 스키마를 그대로 활용하므로 추가 마이그레이션 없이 바로 NUBO로 교체하여 운영 가능합니다.
- **SSR로 강화된 SEO**: Nuxt 4 기반 SSR로 검색 엔진 친화적이며, Hydration 이후에는 Vue 3 + Pinia의 반응형 경험을 그대로 누릴 수 있습니다.
- **UX/검색 품질 개선**: TSBOARD 대비 더 정확한 페이징, 고도화된 검색 옵션, 정돈된 인터랙션을 기본 제공하여 별도 커스터마이징 없이도 완성도 높은 커뮤니티를 구축할 수 있습니다.

## 기술 스택

- 프론트엔드: **Nuxt 4 (Vue 3, SSR)**, **Pinia**, **shadcn-vue**, **Tailwind CSS**, **Tiptap** 에디터
- 백엔드: **GoFiber v3** 기반 GOAPI (별도 서비스로 실행)
- 데이터베이스: **MySQL/MariaDB** (TSBOARD 스키마 호환)

## 빠른 시작

### 1) 사전 준비

- Node.js 24 LTS 이상
- MySQL/MariaDB 인스턴스 (TSBOARD 스키마 그대로 사용)
- 서버 실행용 포트: Nuxt(기본 3000), GOAPI(기본 3006)

### 2) 프로젝트 클론 및 환경 변수 설정

```bash
git clone https://github.com/sirini/nubo.git
cd nubo
./goapi-linux

# 최초로 goapi-linux 실행 시 DB 설정을 진행합니다
# 설정이 완료되면 .env 파일이 생성됩니다
# 생성된 .env 파일을 vscode나 vi로 열어서 API Key 값 등을 추가로 넣을 수 있습니다
```

### 3) 프론트엔드 의존성 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

- 기본적으로 `http://localhost:3000`에서 SSR 개발 서버가 실행됩니다.

### 4) GOAPI 백엔드 준비

- 리포지토리에 포함된 `goapi-linux` 바이너리 또는 [sirini/goapi](https://github.com/sirini/goapi) 소스를 사용해 별도 프로세스로 실행합니다.
- `.env`의 `GOAPI_PORT`, `GOAPI_DOMAIN` 값을 프론트엔드와 일치하도록 맞추고, DB 접속 정보와 관리자 계정을 설정합니다.
- API가 3006 포트에서 동작한다고 가정하면 프론트엔드는 `NUXT_PUBLIC_GOAPI_PORT` 환경변수로 해당 포트를 노출합니다.

### 5) 프로덕션 빌드

```bash
npm run build
npm run preview  # 로컬에서 빌드 결과 확인
```

실제 배포 환경에서는 **PM2** (권장), systemd, Docker 등으로 `node .output/server/index.mjs`를 장기 실행하거나 Nuxt Preview를 프로세스 매니저로 등록할 수 있습니다. NUBO에서는 Nuxt4 및 GOAPI 바이너리 모두 PM2에서 실행하시는 걸 권장합니다. 만약 트래픽이 많은 웹사이트라면, PM2의 클러스터 모드를 이용하여 프론트엔드만 2~4개 병렬 실행하시면 됩니다.

```bash
# 4개의 NUBO 프론트엔드 인스턴스 생성 (자동 부하 분산)
pm2 start .output/server/index.mjs --name "nubo-web" -i 4

# GOAPI 백엔드 바이너리도 pm2로 실행하여 관리
pm2 start ./goapi-linux -name "nubo-api"
```

## 스킨 시스템 활용

- `/app/skins/` 디렉터리 아래에 `layout` · `home` · `board` 등의 경로에서 NUBO의 기본 스킨들이 제공됩니다.
- Tailwind 유틸리티와 shadcn-vue 컴포넌트를 선택적으로 사용하여 색상/타이포 스케일을 쉽게 재정의할 수 있습니다.
- 기본 스킨을 바탕으로 자신만의 디자인 감각을 녹여낸 신규 스킨 개발을 쉽게 해보실 수 있습니다.
- 복잡한 로직들을 모두 알 필요 없이 필요한 변수/함수만 꺼내서 쉽게 호출하여 누구나 자신만의 레이아웃 디자인, 홈 화면 디자인 및 게시판/로그인/프로필 등의 페이지를 디자인 할 수 있습니다.
- 다른 사용자가 만들어준 다양하고 멋진 스킨들도 쉽게 공유할 수 있도록 지원할 예정입니다.

## Nginx 리버스 프록시 예시

Nuxt SSR(3000)을 업스트림으로 두고 HTTPS 종단을 처리하는 예시 설정입니다.

```nginx
# /etc/nginx/sites-available/nubo.conf

upstream nubo_web {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    listen 443 ssl;
    server_name example.com;

    # SSL 설정은 인증서/키 경로에 맞춰 별도 구성
    # ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 정적 파일 캐싱 (필요 시 경로 조정)
    location /_nuxt/ {
        proxy_pass http://nubo_web;
        proxy_cache_valid 200 1h;
    }

    # SSR 렌더링
    location / {
        proxy_pass http://nubo_web;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- Cloudflare 등 프록시를 앞단에 둘 경우 `X-Forwarded-Proto` 헤더가 올바르게 전달되도록 설정하세요.

## 참고 리포지토리

- TSBOARD: https://github.com/sirini/tsboard
- GOAPI (백엔드 엔진): https://github.com/sirini/goapi

## 라이선스

MIT License
