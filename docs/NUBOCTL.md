# nuboctl 설치 준비와 진단

현재 `nuboctl` MVP는 기존 소스 설치를 전환하는 `adopt`, 한국어 대화형 설치를 하는 `install`, 공개 프록시를 연결하는
`activate-nginx`, 배치된 릴리스를 전환하는 `update`, 서버 상태를 읽기만 하는 `doctor`, `status`를 제공한다. AI·자동화는 릴리스
최상위의 `INSTALL_GUIDE_FOR_AI.md`를 따른다.

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

프로세스가 PM2, tmux, 기존 systemd 또는 수동 실행 중 어느 방식인지 추측하거나 프로세스를 종료하지
않는다. dry-run은 내부 포트 `3000`·`3006`의 점유 여부와 종료 필요성을 안내하면서 나머지 계획을
검증한다. 실제 실행은 두 포트 중 하나라도 점유되어 있으면 백업 확인이나 파일 생성 전에 중단한다.
운영자가 기존 프론트엔드와 백엔드를 직접 종료한 뒤 같은 명령을 다시 실행해야 한다. 전환 실패 시에도
기존 프로세스를 자동 재시작하지 않으며 이전 실행 방식으로 직접 시작하도록 안내한다. DB migration은
additive지만 자동 rollback하지 않는다.

`app/skins`의 Vue 스킨은 빌드 시점에 등록된다. 소스/커스텀 빌드 운영에서는 새 clone의 같은 위치에
스킨을 복사한 뒤 `npm ci`, `npm run typecheck`, `npm run build`를 실행해야 관리 화면에 나타난다.
그러나 `server:adopt`는 이 로컬 `.output`이 아니라 `/opt/nubo/current`의 공식 prebuilt를 실행하므로
커스텀 스킨은 adoption 결과에 포함되지 않는다. 커스텀 스킨 사이트는 공식 스킨만 사용해 prebuilt로
전환하거나, 새 clone의 `.output`을 실행하는 별도 소스/커스텀 배포를 유지해야 한다. 공식 릴리스
디렉터리를 직접 수정하면 checksum과 update 검증이 깨진다.

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
- Nginx site를 `/etc/nginx/sites-available/nubo-<도메인>.conf`에 렌더링

안전 규칙:

- 기존 환경 파일은 덮어쓰지 않고 권한·도메인·포트를 검증한 후 보존한다.
- 기존 DB 레코드는 덮어쓰지 않으며 중단된 설치는 같은 명령으로 다시 시도할 수 있다.
- 기존 systemd/Nginx 파일이 예상 결과와 다르면 덮어쓰지 않고 실패한다.
- 기존 `current`가 일반 경로이거나 다른 릴리스를 가리키면 install로 바꾸지 않고 실패한다.
- Nginx 전체 설정 트리에서 대상 도메인이 발견되면 어떤 파일도 만들기 전에 중단한다.
- `nuboctl`이 이전에 만든 동일한 파일은 변경 없이 보존하며 재실행해도 결과가 같다.

Nginx enable·reload와 Certbot/TLS는 아직 수행하지 않는다. DB와 두 애플리케이션 서비스가 준비된 뒤
`doctor`로 실행 조건을 확인하고 공개 프록시 단계로 넘어간다.

## activate-nginx

`install`이 성공한 직후 또는 `status`로 서비스 readiness를 확인한 뒤 설치기가 만든 site만
`sites-enabled`에 연결한다. 전체 설정의
`nginx -t`가 통과해야 Nginx를 부팅 활성화하고, 실행 중이면 reload하며 멈춰 있으면 start한다.

```bash
sudo ./nuboctl activate-nginx --dry-run
sudo ./nuboctl activate-nginx
```

도메인은 `/etc/nubo/nubo.env`의 `NUXT_PUBLIC_DOMAIN`에서 읽는다. 기존 enabled 항목이 일반 파일이거나
다른 설정을 가리키는 링크이면 덮어쓰지 않는다. 설정 검증이나 서비스 반영에 실패하면 이번 실행에서
만든 링크를 제거한다.

이 단계는 HTTP 공개만 활성화한다. DNS가 서버를 가리키는지 확인한 뒤 출력되는
`certbot --nginx -d <도메인> --redirect` 명령으로 운영자가 약관·연락처를 확인하고 TLS를 발급한다.
Certbot 설치와 인증서 발급은 `nuboctl`의 책임 범위에 포함하지 않는다.

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

실제 실행에서는 계획 출력 후 외부 DB·업로드 백업을 완료했다면 빈 입력(Enter)으로 진행한다.
다른 문자열은 취소로 처리한다.
AI·자동화는 질문 대신 두 플래그를 모두 명시한다.

```bash
sudo /opt/nubo/releases/1.3.0/nuboctl update \
  --release /opt/nubo/releases/1.3.0 \
  --non-interactive \
  --backup-confirmed
```

1. 외부 백업 완료 확인
2. 새 릴리스의 additive DB migration 실행
3. 외부 환경 파일의 GOAPI/Nuxt 런타임 버전을 후보 값으로 원자적 갱신
4. `current` 링크를 원자적으로 교체
5. NUBO 서비스 재시작과 readiness 확인
6. 실패하면 이전 환경·링크를 복원하고 이전 서비스를 다시 시작해 readiness 재확인

DB migration은 되돌리지 않는다. 따라서 새 migration은 직전 릴리스와 호환되는 additive 변경이어야 한다.
릴리스 다운로드·압축 해제는 소스 저장소의 `npm run server:update`가 담당하고, 하위 `nuboctl update`는
검증되어 배치된 릴리스부터 처리한다. 데이터 백업은 자동 수행하지 않는다. 동시 update는
설치별 잠금으로 차단한다. 현재 자동 update는 설치된 unit이 `current`를 참조하고 두 릴리스의 systemd/Nginx
템플릿이 같을 때만 허용한다. 운영 템플릿 변경이 필요한 릴리스는 별도 전환 지원이 추가되기 전까지 거부한다.

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
