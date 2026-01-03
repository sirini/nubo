# 🐿️ Nubo

<p align="center">
  <img src="https://img.shields.io/github/license/sirini/nubo?style=flat-square&color=5D6D7E" alt="license">
  <img src="https://img.shields.io/github/stars/sirini/nubo?style=flat-square&color=F4D03F" alt="stars">
  <img src="https://img.shields.io/github/last-commit/sirini/nubo?style=flat-square&color=2ECC71" alt="last commit">
</p>

`Nuxt 4`와 `GoFiber v3` 조합으로 다시 태어난 커뮤니티 / 웹사이트 빌더입니다. `TSBOARD`의 자산을 그대로 계승하면서 SSR(Server Side Rendering)을 통한 SEO(Search Engine Optimization), **스킨 기반 UI 커스터마이징**, 개선된 검색 · 페이징 경험을 한 번에 제공합니다.

### 🛠 Tech Stack

| Category     | Tools                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | ![Nuxt](https://img.shields.io/badge/Nuxt_4-00DC82?style=flat-square&logo=nuxtdotjs&logoColor=white) ![Vue](https://img.shields.io/badge/Vue_3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white) ![Pinia](https://img.shields.io/badge/Pinia-FFE148?style=flat-square&logo=pinia&logoColor=black) ![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white) ![Shadcn](https://img.shields.io/badge/Shadcn_Vue-000000?style=flat-square&logo=shadcnui&logoColor=white) |
| **Backend**  | ![Go](https://img.shields.io/badge/Go_Fiber_v3-00ADD8?style=flat-square&logo=go&logoColor=white)                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Database** | ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white) ![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat-square&logo=mariadb&logoColor=white)                                                                                                                                                                                                                                                                                                                        |

## 주요 강점

- **개선된 백엔드 엔진**

  - TSBOARD에서 검증된 `GoFiber v3` 기반 엔진을 한층 다듬어 높은 성능과 안정성을 제공합니다. 백엔드 코드는 별도로 진행중인 GOAPI([sirini/goapi](https://github.com/sirini/goapi)) 프로젝트를 기반으로 합니다.

- **스킨 시스템 내장**

  - 전체 레이아웃부터 게시판 · 로그인 화면까지 스킨만 교체하면 즉시 화면이 바뀝니다. 제로보드4 / 그누보드5 감성을 모던 웹에서 재현하면서도 shadcn-vue + Tailwind CSS 조합으로 새로운 스킨 개발을 더 쉽고 빠르게 해보실 수 있습니다.
  - 디자이너분들이 최대한 복잡한 로직은 건드리지 않아도 되도록 필수적인 변수나 함수들은 필요할 때만 꺼내서 쓸 수 있도록 구성하였습니다. 덕분에 스킨 디자인을 위해 타입스크립트 언어나 Vue3 프레임워크 혹은 shadcn-vue와 같은 라이브러리를 최소한으로 배우기만 해도 됩니다.
  - `nubo-basic-board` 와 같은 기본 게시판 스킨을 직접 수정해 보세요!

- **DB 호환성 유지**

  - TSBOARD에서 사용하던 DB 스키마를 그대로 활용하므로 추가 마이그레이션 없이 바로 NUBO로 교체하여 운영 가능합니다.
  - 기존 TSBOARD 사용자는 `nubo.git/env.sample` 파일을 먼저 `.env` 로 변경한 후 `tsboard.git/.env` 파일에서 아래의 DB 설정 부분을 `nubo.git/.env`에 적용하고 추가로 필요한 설정 후에 바로 사용 가능합니다.
  - (아래 예시)

  ```conf
  # 데이터베이스 세팅 (DB_UNIX_SOCKET 경로를 모를 경우 공란 유지)
  DB_HOST=localhost
  DB_USER=root
  DB_PASS=_______
  DB_NAME=tsboard
  DB_TABLE_PREFIX=tsb_
  DB_UNIX_SOCKET=/var/run/mysqld/mysqld.sock
  DB_MAX_IDLE=10
  DB_MAX_OPEN=10
  ```

- **SSR로 강화된 SEO**

  - Nuxt 4 기반 SSR로 검색 엔진 친화적이며, Hydration 이후에는 Vue 3 + Pinia의 반응형 경험을 그대로 누릴 수 있습니다.
  - shadcn-vue가 제공하는 기본적인 접근성 덕분에 검색 엔진 뿐만 아니라 AI 서비스들에서도 페이지가 더 쉽게 읽혀집니다.
  - 검색 노출이 불필요한 관리 화면이나 회원 간 1:1 채팅, 글작성 페이지 등은 여전히 클라이언트에서 화면이 만들어져 성능과 보안 모두 챙겼습니다.

- **UX / 검색 품질 개선**

  - TSBOARD 대비 더 정확한 페이징, 고도화된 검색 옵션, 정돈된 인터랙션을 기본 제공하여 별도 커스터마이징 없이도 완성도 높은 커뮤니티를 구축할 수 있습니다.
  - 화면 크기에 따라 매끄럽게 사이트 디자인이 반응합니다. 또한 모바일 기기에서의 UI 접근성이 더욱 개선되었습니다.

## 기술 스택

- 프론트엔드: **Nuxt 4 (Vue 3, SSR)**, **Pinia**, **shadcn-vue**, **Tailwind CSS**, **Tiptap** 에디터
- 백엔드: **GoFiber v3** 기반 GOAPI (별도 서비스로 실행)
- 데이터베이스: **MySQL/MariaDB** (TSBOARD 스키마 호환)

## 빠른 시작

### 1) 사전 준비

- 64bit CPU가 탑재된 (가상)서버에서 적어도 2개 이상의 CPU 코어
- 64bit Linux(WSL2 포함) 혹은 Mac OS
- 이미지 리사이즈 등의 작업에 필요한 `libvips-dev` 라이브러리 사전 설치
- `Node.js` 24 LTS 이상 권장 (`Bun` 은 v1.3 이상, `Deno` 는 v2.0 이상 권장)
- Nginx 웹서버 (Certbot 등으로 SSL 인증서 설치 가능해야 함)
- MySQL / MariaDB 인스턴스
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

- 실제 배포 환경에서는 **PM2** (권장), systemd, Docker 등으로 `node .output/server/index.mjs`를 장기 실행하거나 Nuxt Preview를 프로세스 매니저로 등록할 수 있습니다.
- NUBO에서는 Nuxt4 및 GOAPI 바이너리 모두 PM2에서 실행하시는 걸 권장합니다.
- 만약 트래픽이 많은 웹사이트라면, PM2의 클러스터 모드를 이용하여 프론트엔드만 2~4개 병렬 실행하시면 됩니다.

```bash
# Node.js 클러스터 활용) 4개의 NUBO 프론트엔드 인스턴스 생성 (자동 부하 분산)
pm2 start .output/server/index.mjs --name "nubo-web" -i 4

# GOAPI 백엔드 바이너리도 pm2로 실행하여 관리 가능
pm2 start ./goapi-linux -name "nubo-api"
```

## 스킨 시스템 활용

- `/app/skins/` 아래에 `layout` · `home` · `board` 등의 경로에서 NUBO의 기본 스킨들이 제공됩니다.
- `Tailwind` 유틸리티와 `shadcn-vue` 컴포넌트를 선택적으로 사용하여 **색상/타이포 스케일을 쉽게 재정의** 할 수 있습니다.
- 기본 스킨을 바탕으로 자신만의 디자인 감각을 녹여낸 **신규 스킨 개발을 쉽게** 해보실 수 있습니다.
- 복잡한 로직들을 모두 알 필요 없이 필요한 변수/함수만 꺼내서 쉽게 호출하여 누구나 자신만의 레이아웃 디자인, 홈 화면 디자인 및 게시판/로그인/프로필 등의 페이지를 디자인 할 수 있습니다.
- 다른 사용자가 만들어준 다양하고 멋진 스킨들도 쉽게 공유할 수 있도록 지원할 예정입니다.

## Nginx 리버스 프록시 예시

Nuxt SSR(3000)을 업스트림으로 두고 HTTPS 종단을 처리하는 예시 설정입니다.

```nginx
# /etc/nginx/sites-available/nubo.conf

server {
    listen 80;
    listen 443 ssl;

    # 사용하시는 도메인
    server_name example.com;

    # SSL 설정은 인증서/키 경로에 맞춰 별도 구성 (Certbot 등을 활용하시는 걸 권장합니다)
    # ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 루트 경로 지정 (npm run build 시 만들어지는 dist 폴더를 지정하시면 편합니다)
    root /var/www/nubo.git/dist;

    # SSR 렌더링
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 첨부파일 업로드 크기 제한 설정 (서버 사정에 맞춰서 조절하세요)
    client_max_body_size 50M;

    # 업로드 경로 지정 (이미지 등의 첨부파일에 정상적으로 접근하려면 반드시 설정해야 합니다)
    location /upload/ {
      alias /var/www/nubo.git/upload/;
      autoindex off;
    }
}
```

- Cloudflare 등 프록시를 앞단에 둘 경우 `X-Forwarded-Proto` 헤더가 올바르게 전달되도록 설정하세요.

## 참고 리포지토리

- TSBOARD: https://github.com/sirini/tsboard
- GOAPI (백엔드 엔진): https://github.com/sirini/goapi

## 라이선스

MIT License
