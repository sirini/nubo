# AI를 위한 NUBO 설치 계약

이 문서는 AI 에이전트가 한국어 사용자의 Ubuntu 서버에 NUBO prebuilt를 안전하게 준비하기 위한 실행 계약이다.
추측으로 기존 파일을 수정하지 말고, 명령이 실패하면 출력된 원인을 사용자에게 설명한다.

## 지원 환경

- Ubuntu 22.04 이상 amd64 한 대
- 일반 x86-64 CPU(SSE4.2가 없는 구형 가상 CPU 포함)
- systemd, Nginx, Node.js 22 이상
- MySQL 또는 MariaDB
- 압축을 푼 NUBO 공식 `linux-amd64` 릴리스

컨테이너, 다른 Linux 배포판, Kubernetes는 현재 지원하지 않는다.
libvips와 이미지 코덱은 호환판·최적화판으로 릴리스에 포함된다. CPU에 맞는 판을 glibc가 자동 선택하므로
`libvips-dev`나 `libvips42`를 설치하거나 CPU 옵션을 지정하지 않는다.
Ubuntu와 Node.js는 위 최소 버전만 검사하며 이후 버전에 별도 상한을 두지 않는다. 설치 전후의 실제
호환성은 `nuboctl doctor`와 서비스 readiness로 확인한다.

## 반드시 지킬 규칙

1. 실제 설치 전에 같은 옵션으로 `--dry-run`을 성공시킨다.
2. DB 비밀번호와 관리자 비밀번호를 CLI 인자로 전달하지 않는다.
3. 비밀값은 `0600` 권한의 `--env-input` 파일로 전달한다.
4. 기존 환경·systemd·Nginx 파일을 직접 덮어쓰거나 삭제하지 않는다.
5. 기존 Nginx 설정이 도메인을 사용하면 자동 우회하지 말고 사용자에게 충돌 파일을 알린다.
6. 실패하면 먼저 오류 출력을 보존하고 `nuboctl doctor`로 현재 상태를 확인한다.
7. Nginx 활성화 전에도 `activate-nginx --dry-run`을 먼저 성공시킨다.

## 기존 소스 설치 adoption

v1.2.0 이전 소스·PM2 설치를 전환해 달라는 요청에는 현재 checkout에서 먼저 계획만 확인한다.

```bash
npm run server:adopt -- --dry-run
```

출력에 표시된 기존 소스, `.env`, 업로드 경로, 도메인과 서비스 계정을 사용자에게 확인받는다. 서버 밖의
DB dump와 업로드 백업을 사용자가 완료했다고 명시한 경우에만 실제 명령을 실행한다.

```bash
npm run server:adopt
```

대화형 명령은 백업 완료 시 빈 입력(Enter)으로 진행하고 다른 문자열로 취소한다. AI가 사용자 대신 Enter를
입력하거나 `--backup-confirmed`를 추측으로 추가하지 않는다. 자동화가 사용자의 백업 완료 확인을 이미 받은
경우에만 `--non-interactive --backup-confirmed`를 함께 전달한다.

adoption은 기존 소스·`.env`·업로드·DB·Nginx/TLS를 삭제, 이동, 수정하거나 reload하지 않는다. PM2,
tmux, systemd 등 기존 프로세스 관리 방식을 추측하거나 프로세스를 자동 종료·재시작하지 않는다.
포트 `3000`·`3006` 점유 안내가 나오면 사용자가 기존 프론트엔드와 백엔드를 직접 종료하도록 안내한 뒤
같은 명령을 다시 실행한다. 홈 디렉터리의 NVM Node는 systemd용 `/opt/nubo/runtime/node`에 자동 복사된다.
DB migration은 자동 rollback되지 않는다.
root 계정만 제공되는 기존 VPS에서는 프로젝트 소유자가 root여도 adoption을 허용한다. 출력되는 root
서비스 경고를 사용자에게 알리되 일반 계정 생성을 필수 조건으로 만들지 않는다.

## 새 설치 입력 파일

`share/install-input.sample`을 운영자만 읽을 수 있는 임시 경로로 복사해 값을 채운다.

```bash
sudo install -m 0600 share/install-input.sample /root/nubo-install.env
sudoedit /root/nubo-install.env
```

다음 값은 반드시 실제 값이어야 한다.

- `GOAPI_TITLE`, `NUXT_PUBLIC_TITLE`: 같은 커뮤니티 이름
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_TABLE_PREFIX`
- `ADMIN_ID`, `ADMIN_PW`, `NUXT_PUBLIC_ADMIN_ID`: 두 관리자 ID는 같은 이메일

`DB_PORT`는 1~65535 숫자이고 `ADMIN_PW`는 8자 이상이어야 한다. JWT와 SYNC 비밀값은 새 환경 파일을
만들 때 `nuboctl`이 자동 생성한다.

## 비대화형 실행

압축을 푼 릴리스 최상위에서 실행한다. 경로와 도메인은 실제 서버 값으로 바꾼다.

```bash
sudo ./nuboctl install \
  --non-interactive \
  --domain community.example.com \
  --release /opt/nubo/releases/1.3.0 \
  --env-input /root/nubo-install.env \
  --dry-run
```

dry-run이 종료 코드 `0`으로 끝나고 계획이 사용자 의도와 같을 때만 `--dry-run`을 제거해 다시 실행한다.

```bash
sudo ./nuboctl install \
  --non-interactive \
  --domain community.example.com \
  --release /opt/nubo/releases/1.3.0 \
  --env-input /root/nubo-install.env
```

기존 `/etc/nubo/nubo.env`가 있으면 `--env-input`을 생략할 수 있다. 기존 환경 파일은 수정하지 않고 검증 후 보존한다.
검증과 DB 준비에는 `--release`의 버전 디렉터리를 사용하지만, 서비스는 설치기가 만드는
`/opt/nubo/current` 링크만 참조한다. 이 링크를 미리 일반 디렉터리로 만들거나 직접 교체하지 않는다.

## 현재 완료 범위

`install`은 서비스 계정, 환경 파일, 상태·업로드 경로와 DB의 기본 관리자·게시판·최신 스키마를 준비한다.
systemd 서비스를 활성화하고 로컬 readiness까지 확인하지만 Nginx site는 비활성 상태로 만든다.
새 설치와 adoption은 대표 `nubo.service`로 내부 GOAPI·Web 서비스를 함께 관리한다. 운영자는
`systemctl restart nubo`를 사용하며 필요할 때만 `nubo-goapi`와 `nubo-web`을 개별 관리한다.
설치된 lifecycle drop-in의 `PartOf=nubo.service` 관계가 대표 restart를 두 프로세스에 직접 전파한다.

`doctor`와 설치가 성공한 뒤 설치기가 만든 site만 별도 활성화한다.

```bash
sudo ./nuboctl activate-nginx --dry-run
sudo ./nuboctl activate-nginx
```

두 명령이 모두 성공하면 HTTP 공개 상태다. Certbot 설치, 약관 동의, 인증서 발급과 HTTPS redirect는
운영자에게 넘기고 `activate-nginx`가 출력한 도메인별 명령을 임의로 자동 실행하지 않는다.

## update

NUBO 소스 checkout을 관리 중이면 `git pull --ff-only && npm run server:update`가 새 릴리스의 다운로드,
SHA-256 검증과 `/opt/nubo/releases` 배치를 수행한다. 직접 배치할 때는 새 릴리스를 현재 릴리스와 같은
`/opt/nubo/releases` 아래에 먼저 압축 해제한다. DB와 업로드의 외부
백업 완료를 사용자에게 확인받고 후보 릴리스의 `nuboctl`로 dry-run을 먼저 실행한다.

```bash
sudo /opt/nubo/releases/1.3.0/nuboctl update \
  --release /opt/nubo/releases/1.3.0 \
  --dry-run
```

dry-run과 백업이 모두 확인됐을 때만 자동화용 실행 플래그를 사용한다.

```bash
sudo /opt/nubo/releases/1.3.0/nuboctl update \
  --release /opt/nubo/releases/1.3.0 \
  --non-interactive \
  --backup-confirmed
```

`--backup-confirmed`를 추측으로 추가하지 않는다. update 실패 시 출력에 이전 릴리스 복구 성공 여부와
DB migration이 유지된다는 안내가 포함되므로, 추가 전환 전에 그대로 사용자에게 보고한다.

DB 설치가 실패해도 기존 레코드를 덮어쓰지 않으므로 원인을 고친 뒤 같은 명령을 다시 실행한다.

진단 명령:

```bash
sudo ./nuboctl doctor \
  --release /opt/nubo/current \
  --env /etc/nubo/nubo.env \
  --state /var/lib/nubo \
  --user nubo
```

종료 코드:

- `0`: 실패 없음
- `1`: 설치 준비 또는 진단 실패
- `2`: 명령·옵션·사용자 입력 오류
