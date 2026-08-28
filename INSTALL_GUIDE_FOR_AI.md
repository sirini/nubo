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
5. Nginx와 TLS는 운영자 소유이므로 NUBO 설치 과정에서 생성·수정·활성화·reload하지 않는다.
6. 실패하면 먼저 오류 출력을 보존하고 `nuboctl doctor`로 현재 상태를 확인한다.

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
- `NUXT_APP_BASE_URL`: 루트 배포는 `/`, 하위 경로 배포는 `/sample/` 형식
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
systemd 서비스를 활성화하고 로컬 readiness까지 확인하지만 Nginx와 TLS는 읽거나 변경하지 않는다.
새 설치와 adoption은 대표 `nubo.service`로 내부 GOAPI·Web 서비스를 함께 관리한다. 운영자는
`systemctl restart nubo`를 사용하며 필요할 때만 `nubo-goapi`와 `nubo-web`을 개별 관리한다.
설치된 lifecycle drop-in의 `PartOf=nubo.service` 관계가 대표 restart를 두 프로세스에 직접 전파한다.

`doctor`와 설치가 성공한 뒤 운영자에게 기존 Nginx/TLS 설정 연결과 `nginx -t` 검증을 요청한다.
AI는 운영자의 명시적 승인 없이 `/etc/nginx` 파일이나 링크를 만들거나 서비스를 reload하지 않는다.

## update

소스 checkout에서 `git pull --ff-only && npm run server:stage`로 공식 릴리스를 다운로드·검증·배치한다.
제한망에서는 archive와 `.sha256`을 반입해 `server:stage -- --archive ... --checksum ...`에 전달한다.
staging은 실행 중인 서비스, DB와 `current` 링크를 바꾸지 않는다. 출력된 후보 경로의 `nuboctl`로
dry-run을 먼저 실행한다.

```bash
sudo /opt/nubo/releases/nubo-1.3.0-linux-amd64/nuboctl \
  apply /opt/nubo/releases/nubo-1.3.0-linux-amd64 --dry-run
```

dry-run과 백업이 모두 확인됐을 때만 자동화용 실행 플래그를 사용한다.

```bash
sudo /opt/nubo/releases/nubo-1.3.0-linux-amd64/nuboctl \
  apply /opt/nubo/releases/nubo-1.3.0-linux-amd64 \
  --non-interactive \
  --backup-confirmed
```

`--backup-confirmed`를 추측으로 추가하지 않는다. apply 실패 시 출력에 이전 릴리스 복구 성공 여부와
DB migration이 유지된다는 안내가 포함되므로, 추가 전환 전에 그대로 사용자에게 보고한다.

DB 설치가 실패해도 기존 레코드를 덮어쓰지 않으므로 원인을 고친 뒤 같은 명령을 다시 실행한다.

## 기존 이미지 설명 소급 적용

운영자가 기존 첨부 이미지의 AI 설명을 요청하면 먼저 읽기 전용 스캔만 실행한다.

```bash
sudo -u nubo python3 /opt/nubo/current/share/tools/backfill_image_descriptions.py \
  --env-file /etc/nubo/nubo.env --scan-only
```

대상·처리 가능·처리 불가 개수, 예상 비용과 업로드 루트를 그대로 보고한다. 실제 실행은 서버 밖의 DB
백업 완료와 비용·OpenAI 이미지 전송에 대한 운영자의 명시적 승인을 받은 뒤에만 `--scan-only`를 제거한다.
대화형 확인 문자열 `진행`은 운영자가 직접 입력해야 하며 AI가 대신 입력하거나 파이프로 전달하지 않는다.
처음에는 `--limit 10`처럼 작은 묶음을 권장하고, 실패 출력과 실제 누적 토큰·비용 요약을 보존한다.

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
