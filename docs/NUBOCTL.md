# nuboctl 설치 준비와 진단

최초 `install`과 기존 소스의 `adopt`는 PATH에 관리 명령이 생기기 전이므로 저장소의 npm bootstrap을
사용한다. 설치가 끝난 뒤 운영자가 기억할 공개 명령은 `nuboctl status`, `doctor`, `update`, `customize`,
`releases`, `market`이다. `skin apply`와 `update --release`는 공개 명령이 준비한 파일을 안전하게 전환하는 내부
경계이며 일반 사용자가 직접 실행하지 않는다. AI·자동화는 릴리스 최상위의
`INSTALL_GUIDE_FOR_AI.md`를 따른다.

TTY에서는 단계, 성공, 주의와 실패를 색과 기호로 구분한다. 로그 파일이나 파이프 출력은 자동으로
평문이 되며, 색을 원하지 않으면 `NO_COLOR=1 nuboctl ...`처럼 실행한다.

```bash
nuboctl
nuboctl help
nuboctl help update
nuboctl customize --help
```

`status`와 `doctor`의 업로드 쓰기 검사는 고정된 `nubo` 계정을 가정하지 않고 systemd가
`nubo-goapi.service`에 실제 적용한 `User`를 사용한다. 실행 상태를 읽지 못하면 설치된 unit의
`User=`를 사용하며, 그것도 확인할 수 없을 때만 `--user` 또는 기본 `nubo`로 돌아간다.

## adopt

`adopt`는 v1.2.0 이전의 소스 설치를 v1.2.2 이후의 prebuilt·systemd 운영 체제로 한 번만
전환한다. 일반 사용자는 하위 바이너리를 직접 실행하지 않고 저장소 wrapper를 사용한다.

```bash
cd /var/www
git clone --depth=1 https://github.com/sirini/nubo.git nubo-new
cp /var/www/nubo-old/.env /var/www/nubo-new/.env
cp -a /var/www/nubo-old/upload /var/www/nubo-new/upload
cd /var/www/nubo-new
sudo ss -ltnp | grep -E ':(3000|3006)\b' || true
npm run server:adopt -- --dry-run
npm run server:adopt
```

기존 checkout에서 `git pull`하기보다 옆 경로의 깨끗한 clone에 `.env`와 `upload`를 복사하는 절차를
권장한다. clone은 이후 서비스를 실행할 계정으로 만들고, root-only 서버가 아니라면 `sudo git clone`을
피한다. PM2, tmux, 기존 systemd 또는 수동 명령으로 실행 중인 NUBO만 직접 종료해 `3000`·`3006`
포트를 비운 뒤 명령을 실행한다. 새 clone에서 공식 adoption만 할 때는 `npm ci`와 Nuxt 빌드가 필요 없다.

wrapper는 현재 공식 통합 릴리스를 내려받아 checksum을 검증하고 `/opt/nubo/releases`에 배치한 뒤,
새 clone 경로를 `--source`로 전달한다. 복사한 `.env`의 상대 `NUBO_UPLOAD_DIR`는 새 clone을 기준으로
해석한다. 기존 Nginx/TLS는 수정하지 않으므로 `/upload/`의 `alias`가 dry-run에 표시된 업로드 절대
경로와 같은지 운영자가 확인하고, 다르면 Nginx 설정을 직접 갱신·검증한다.

실제 전환 전에는 외부 DB·업로드 백업을 완료했다면 빈
입력(Enter)으로 진행하며 다른 문자열은 취소로 처리한다. 자동화는 사용자의 확인을 받은 경우에만
`--non-interactive --backup-confirmed`를 함께 사용한다.

전환 시 기존 소스, `.env`, 업로드, DB와 Nginx/TLS는 원래 위치에 그대로 둔다. `.env`의 단순
`${KEY}` 참조를 풀어 현재 sample 형식의 `/etc/nubo/nubo.env`를 만들고, 기존 소스 소유자를 systemd
서비스 사용자로 사용한다. 환경 원본 참고본은 `/var/lib/nubo/adoption/legacy.env`에 `0600`으로 보관한다.
레거시 Gmail 설정은 현재의 Resend 계약으로 자동 변환할 수 없어 경고하며 복사하지 않는다.
기존 프로젝트가 root 소유인 root-only VPS도 차단하지 않는다. 이 경우 실행 계획에 root 서비스 경고를
표시하되 systemd의 `NoNewPrivileges`, `ProtectHome`, `ProtectSystem=strict`와 업로드 외 쓰기 경로 제한은
그대로 적용한다. 일반 계정 사용은 권장이지만 adoption의 필수 조건은 아니다.
NVM처럼 선택된 Node.js가 `/home` 또는 `/root` 아래에 있으면 `ProtectHome=true`인 unit에서도 실행되도록
`/opt/nubo/runtime/node`에 복사하고 unit은 이 안정 경로를 사용한다.

`install`을 기존 서버에서 다시 실행하면 설치된 GOAPI unit의 `User`와 `Group`을 기본값으로 재사용한다.
명시적인 `--user`·`--group`은 이 값을 덮어쓴다. 기존 환경 파일은 비밀값과 운영 설정을 유지하면서
`GOAPI_VERSION`·`NUXT_PUBLIC_VERSION`만 현재 릴리스에 맞추며, 이미 실행 중인 대표 unit이 있어도 GOAPI와
Web을 명시적으로 재시작한다. Web unit은 Node.js가 `/root/.nvm`이나 `/home/...` 아래 있을 때만 홈을
읽기 전용으로 노출하고 쓰기는 계속 차단하며, 시스템 경로의 Node.js를 쓰면 홈을 완전히 숨긴다.
이 `ProtectHome` 설치 정책 한 줄의 릴리스 간 차이는 실행 중인 unit을 자동 변경하지 않는 update에서
호환 가능한 것으로 취급하며, 그 밖의 systemd·Nginx 템플릿 변경 차단은 유지한다.

프로세스가 PM2, tmux, 기존 systemd 또는 수동 실행 중 어느 방식인지 추측하거나 프로세스를 종료하지
않는다. dry-run은 내부 포트 `3000`·`3006`의 점유 여부와 종료 필요성을 안내하면서 나머지 계획을
검증한다. 실제 실행은 두 포트 중 하나라도 점유되어 있으면 백업 확인이나 파일 생성 전에 중단한다.
운영자가 기존 프론트엔드와 백엔드를 직접 종료한 뒤 같은 명령을 다시 실행해야 한다. 전환 실패 시에도
기존 프로세스를 자동 재시작하지 않으며 이전 실행 방식으로 직접 시작하도록 안내한다. DB migration은
additive지만 자동 rollback하지 않는다.

`app/skins`의 Vue 스킨은 빌드 시점에 등록된다. 기본 스킨을 직접 수정하기보다 별도 key의 폴더로
복사해 사이트 전용 스킨으로 관리한다. adoption 뒤에는 `nuboctl customize`가 필요할 때만
`npm ci`를 실행하고 typecheck·production build를 거쳐 공식 기반과 로컬 Web을 결합한 파생 릴리스를
만든다. 하위 `nuboctl skin apply`는 같은 공식 버전과 GOAPI/nuboctl/libvips 출처, checksum, 설치 환경과
systemd 계약을 검증한 뒤 current 링크와 Web만 전환한다. readiness가 실패하면 이전 링크와 Web을
복원한다. DB migration, 환경 버전 변경, GOAPI 재시작은 수행하지 않는다.

```bash
nuboctl customize --dry-run
nuboctl customize
```

`--dry-run`도 실제 빌드와 파생 릴리스 검증까지 수행하지만 current와 서비스는 변경하지 않는다. 공식
릴리스 디렉터리를 직접 수정하면 checksum과 update 검증이 깨진다.

현재 package lock은 저사양 가상 CPU에서 Vite 8의 변환이 멈추는 문제를 피하기 위해
`rolldown-vite@7.3.1`을 호환 빌더로 고정한다. `nuboctl customize`가 필요한 의존성을 자동 준비하므로
운영자가 Vite를 따로 설치하지 않는다. nuboctl은 `customize`와 update의 커스텀 Web 재빌드에 Node heap
1536 MiB 기본값을 자동 적용한다. 기존 `NODE_OPTIONS`에 `--max-old-space-size` 또는
`--max_old_space_size`를 지정했다면 그 값을 우선하며 다른 Node 옵션도 보존한다. 커널 OOM이라면 V8 heap
한도와 별개 문제이므로 swap이나 더 많은 사용 가능한 메모리를 준비한다.

`nuboctl customize`가 한 번 성공하면 checkout의 `.nubo` 상태에 자동 적용 의도를 기록한다. 이후
`nuboctl update`는 새 공식 버전용 커스텀 Web을 서비스 전환 전에 typecheck·빌드한다. 빌드가 실패하면
기존 사이트를 변경하지 않고, 공식 update가 성공한 뒤 준비한 Web을 적용한다. 적용만 실패한 경우에는
새 공식 Web을 정상 상태로 남기고 복구 명령을 안내한다. 이번 update에서만 생략하려면
`nuboctl update --no-customize`를 사용한다.

## NUBO Market 스킨 찾기·설치·삭제

`nuboctl market`은 공개 Registry의 스킨을 검색하고 NUBO 소스 checkout에 설치한다. 웹에서는
`https://nubohub.org/market/`에서 같은 카탈로그와 상세 정보를 볼 수 있다. 명령별 설명은
`nuboctl market help` 또는 `nuboctl market help <명령>`으로 확인한다. 다운로드한
`.tar.gz`의 Registry SHA-256, manifest key/version, NUBO 최소 버전, 단일 최상위 폴더를 확인하고
경로 탈출, 링크·특수 파일, 과도한 압축 해제 크기를 거부한다. 같은 key의 기존 폴더는 자동으로
덮어쓰지 않는다. 성공한 설치는 스킨 폴더의 `.nubo-market.json`에 package identity와 파일별
SHA-256을 기록한다.

```bash
nuboctl market help
nuboctl market help install
nuboctl market search gallery
nuboctl market info nubo-awesome-gallery
nuboctl market install nubo-awesome-gallery
nuboctl market install nubo-awesome-gallery --version 1.0.0
nuboctl market remove nubo-awesome-gallery --dry-run
nuboctl market remove nubo-awesome-gallery
nuboctl customize --dry-run
```

기본 Registry는 `https://nubohub.org/market`이다. 로컬 MVP를 시험할 때만
`--registry http://127.0.0.1:3009` 또는 `NUBO_MARKET_URL`을 사용한다. 설치는 서버 프로세스를
변경하거나 빌드하지 않으며, 실제 적용은 기존 `nuboctl customize` 경계를 따른다.

`market remove`는 설치 영수증의 모든 파일이 현재 checksum과 일치하고, 영수증에 없는 파일이나
누락 파일·링크가 없을 때만 폴더를 삭제한다. 수정한 스킨, 수동 설치 폴더, 기존 기본 스킨처럼 영수증이
없는 폴더는 자동 삭제하지 않으며 `--force` 옵션도 제공하지 않는다. 사용 중인 스킨은 관리화면에서
먼저 다른 스킨으로 전환하고, `--dry-run`으로 삭제 영향을 확인한 뒤 삭제한다. 설치와 삭제 후에는
`nuboctl customize`를 실행해야 운영 Web에 반영된다. 기존
`nuboctl skin search/info/install`은 호환 별칭으로 유지한다.

## install

사람이 실행할 때는 옵션 없이 시작한다. 도메인·커뮤니티 이름·DB·최초 관리자 정보를 한국어로 묻고,
비밀번호는 화면에 표시하지 않는다. 실제 변경 전에 전체 계획을 보여주고 마지막 동의를 받는다.

```bash
sudo ./nuboctl install
```

기본 경로와 일부 값을 바꾸려면 옵션을 함께 줄 수 있으며, 질문 화면에서 나머지를 입력한다.

```bash
sudo ./nuboctl install \
  --domain community.example.com \
  --release /opt/nubo/releases/1.2.2 \
  --upload /var/www/community.example.com/upload \
  --dry-run
```

`--dry-run`은 입력과 계획을 확인하지만 파일을 변경하지 않는다. 기본값은 `nubo` 사용자/그룹,
`/opt/nubo/current` 릴리스 링크, `/etc/nubo/nubo.env`, `/var/lib/nubo`, `/var/lib/nubo/upload`,
Nuxt `3000`, GOAPI `3006`이다.

AI·자동화는 비밀값을 CLI에 노출하지 않고 `0600` 입력 파일과 명시적인 비대화형 모드를 사용한다.

```bash
sudo ./nuboctl install \
  --non-interactive \
  --domain community.example.com \
  --release /opt/nubo/releases/1.3.0 \
  --env-input /root/nubo-install.env \
  --dry-run
```

`install`이 수행하는 일:

- release manifest와 checksum 목록의 파일, 필수 entrypoint/템플릿 검증
- 서비스 사용자/그룹과 상태·업로드 경로 준비
- 환경 파일이 없으면 sample에서 생성하고 JWT/SYNC 비밀값을 무작위로 생성
- 환경 파일을 `0640`, `root:<서비스 그룹>`으로 저장
- 지정한 DB가 없으면 생성하고 기본 관리자·게시판과 최신 스키마 준비
- `/opt/nubo/current`가 검증한 버전 디렉터리를 가리키도록 생성
- systemd unit을 `/etc/systemd/system`에 렌더링
- 대표 `nubo.service`를 enable/start해 내부 `nubo.target`의 GOAPI·Web을 함께 올리고 로컬 `/ready`가 정상일 때까지 확인
- GOAPI·Web에 `PartOf=nubo.service` lifecycle drop-in을 설치해 `systemctl restart nubo`를 두 프로세스에 직접 전파
- `/usr/local/bin/nuboctl`이 `/opt/nubo/current/nuboctl`을 가리키게 해 버전 전환 뒤에도 짧은 명령을 유지

안전 규칙:

- 기존 환경 파일은 덮어쓰지 않고 권한·도메인·포트를 검증한 후 보존한다.
- 기존 DB 레코드는 덮어쓰지 않으며 중단된 설치는 같은 명령으로 다시 시도할 수 있다.
- 기존 systemd 파일이 예상 결과와 다르면 덮어쓰지 않고 실패한다.
- 기존 `current`가 일반 경로이거나 다른 릴리스를 가리키면 install로 바꾸지 않고 실패한다.
- `nuboctl`이 이전에 만든 동일한 파일은 변경 없이 보존하며 재실행해도 결과가 같다.

Nginx와 TLS는 운영자 소유다. `install`은 `/etc/nginx`를 읽거나 생성·수정·reload하지 않는다.
DB와 두 애플리케이션 서비스가 준비된 뒤 `doctor`의 읽기 전용 진단과 Nginx 예시를 참고해
운영자가 기존 프록시 설정을 직접 연결한다.

## update

릴리스는 `/opt/nubo/releases/<버전>` 아래의 변경하지 않는 디렉터리로 배치하고, systemd는 항상
`/opt/nubo/current` 심볼릭 링크를 참조한다. `update`는 운영자가 같은 `releases` 디렉터리에 미리
배치한 더 높은 `major.minor.patch` 릴리스만 받아 checksum과 호환성을 확인하고 전환한다.

후보 릴리스에 포함된 `nuboctl`로 먼저 dry-run한다.

```bash
sudo /opt/nubo/releases/1.3.0/nuboctl update \
  --release /opt/nubo/releases/1.3.0 \
  --dry-run
sudo /opt/nubo/releases/1.3.0/nuboctl update \
  --release /opt/nubo/releases/1.3.0
```

이전·후보 manifest의 GOAPI commit이 다를 때만 계획 출력 후 외부 DB·업로드 백업을 확인한다. 백업을
완료했다면 빈 입력(Enter)으로 진행하고 다른 문자열은 취소한다. GOAPI commit이 같으면 migration과
백업 질문을 모두 생략한다. AI·자동화는 GOAPI가 바뀌고 실제 백업을 확보한 경우에만 두 플래그를 명시한다.

```bash
sudo /opt/nubo/releases/1.3.0/nuboctl update \
  --release /opt/nubo/releases/1.3.0 \
  --non-interactive \
  --backup-confirmed
```

1. 외부 백업 확인 뒤 전환 직전의 정상 릴리스를 `/opt/nubo/previous`에 원자적으로 기록
2. GOAPI가 바뀐 경우 additive DB migration 실행
3. 외부 환경 파일의 GOAPI/Nuxt 런타임 버전을 후보 값으로 원자적 갱신
4. `current` 링크를 원자적으로 교체
5. NUBO 서비스 재시작과 readiness 확인
6. 실패하면 이전 환경·링크를 복원하고 이전 서비스를 다시 시작해 readiness 재확인

DB migration은 되돌리지 않는다. 따라서 새 migration은 직전 릴리스와 호환되는 additive 변경이어야 한다.
사용자가 프로젝트 폴더에서 실행하는 `nuboctl update`는 먼저 공식 소스 변경이 남아 있지 않은지
확인하고 `git pull --ff-only`를 실행한다. 별도 key의 사이트 스킨 변경은 허용하지만 `nubo-basic-*`와
그 밖의 공식 파일 변경, detached branch, upstream 부재와 분기된 이력은 덮어쓰지 않고 중단한다.
그 뒤 릴리스 다운로드·압축 해제와 필요하면 커스텀 Web 사전 빌드를 수행하고, 새 릴리스의
`nuboctl update --release ...`가 안전한 전환을 처리한다. 데이터 백업은 자동 수행하지 않는다. 동시 update는
설치별 잠금으로 차단한다. 현재 자동 update는 설치된 unit이 `current`를 참조하고 두 릴리스의 systemd/Nginx
템플릿이 같을 때만 허용한다. 운영 템플릿 변경이 필요한 릴리스는 별도 전환 지원이 추가되기 전까지 거부한다.
공개 `--dry-run`도 fast-forward pull과 후보·커스텀 Web 준비는 수행한다. 서비스·DB·`current`는
변경하지 않으며, checkout도 갱신하지 않으려면 `--no-pull`을 함께 사용한다.

## releases

`/opt/nubo/releases`의 불변 릴리스는 자동으로 덮어쓰지 않는다. `list`는 전체 릴리스의 버전·크기와 보호
이유를 읽기 전용으로 보여주고, `prune`은 아래 기본 보존 집합 밖의 릴리스만 정리한다.

- `/opt/nubo/current`가 가리키는 현재 활성 릴리스
- update·customize 전환 직전에 기록한 `/opt/nubo/previous`
- 현재 커스텀 빌드와 같은 버전의 공식 기반 릴리스
- 위 대상 외에 수정 시각이 가장 최근인 예비 릴리스 1개
- manifest를 인식할 수 없거나 전체 checksum·필수 파일 검증에 실패한 디렉터리

```bash
nuboctl releases list
sudo nuboctl releases prune --dry-run
sudo nuboctl releases prune
```

추가 예비 릴리스 수는 `--keep N`으로 조정한다. 실제 정리는 update와 같은 설치 잠금을 얻고, 삭제 직전에도
대상이 `current`나 `previous`로 바뀌지 않았는지와 전체 릴리스 무결성을 다시 확인한다. checksum에 없는
운영자 파일이나 릴리스 밖을 향한 링크가 하나라도 있으면 디렉터리 전체를 보존한다. 보관함 자체가
심볼릭 링크이거나 보호 링크가 보관함의 직접 하위를 가리키지 않으면 중단한다. 자동 정리는 아직 하지 않으며
운영자가 dry-run 결과를 확인한 뒤 명시적으로 실행한다.

## doctor

설치 전후의 실행 조건과 릴리스 무결성을 검사한다.

```bash
sudo ./nuboctl doctor \
  --release /opt/nubo/current \
  --env /etc/nubo/nubo.env \
  --state /var/lib/nubo \
  --user nubo
```

검사 항목:

- Linux amd64와 Ubuntu 22.04 이상 여부
- CPU에 맞춰 자동 선택되는 내장 libvips 호환판·최적화판, Node 22 이상, systemd, Nginx
- `manifest.json` 대상 플랫폼과 컴포넌트 dirty 상태
- `checksums.txt`에 기록된 파일의 손상과 release 밖 경로·심볼릭 링크 차단
- 환경 파일 구문, 필수값, 비밀값 파일 권한, loopback 수신 주소
- `NUBO_UPLOAD_DIR` 또는 기본 업로드 경로와 `nubo` 사용자의 쓰기 권한
- 기존 Nginx 전체 설정의 `nginx -t` 결과

환경 파일이 아직 없는 설치 전 실행에서는 경고만 출력하고 나머지 사전 조건을 계속 검사한다.
기존 도메인의 Nginx 설정은 읽거나 검증할 뿐 수정하거나 reload하지 않는다.

## status

설치된 서비스와 HTTP 상태를 검사한다.

```bash
sudo /opt/nubo/current/nuboctl status
```

검사 항목:

- release manifest
- `/etc/nubo/nubo.env`와 업로드 디렉터리
- `nubo-goapi.service`, `nubo-web.service`, `nginx.service`
- Nuxt의 `/health`, `/ready`, `/version`

기본 HTTP 주소는 `NITRO_HOST`와 `NITRO_PORT`로 계산하며 필요하면
`--web-url http://127.0.0.1:3000`으로 덮어쓸 수 있다.

## 종료 코드

- `0`: 실패 없음. 경고는 있을 수 있음
- `1`: 하나 이상의 검사 실패
- `2`: 잘못된 명령이나 옵션

`start`, `stop`, `restart`, `logs`, `rollback`은 아직 구현되지 않았다.

설치·adoption·update는 `/usr/local/bin/nuboctl` 링크가 없으면 만들고, 이미 올바른 링크면 보존한다.
일반 파일이나 다른 대상을 가리키는 링크가 있으면 덮어쓰지 않고 중단한다.
