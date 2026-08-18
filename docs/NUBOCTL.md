# nuboctl 설치 준비와 진단

현재 `nuboctl` MVP는 한국어 대화형 설치 준비를 하는 `install`과 서버 상태를 읽기만 하는
`doctor`, `status`를 제공한다. AI·자동화는 릴리스 최상위의 `INSTALL_GUIDE_FOR_AI.md`를 따른다.

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
  --release /opt/nubo/releases/1.2.1 \
  --upload /var/www/community.example.com/upload \
  --dry-run
```

`--dry-run`은 입력과 계획을 확인하지만 파일을 변경하지 않는다. 기본값은 `nubo` 사용자/그룹,
`/etc/nubo/nubo.env`, `/var/lib/nubo`, `/var/lib/nubo/upload`, Nuxt `3000`, GOAPI `3006`이다.

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
- systemd unit을 `/etc/systemd/system`에 렌더링
- Nginx site를 `/etc/nginx/sites-available/nubo-<도메인>.conf`에 렌더링

안전 규칙:

- 기존 환경 파일은 덮어쓰지 않고 권한·도메인·포트를 검증한 후 보존한다.
- 기존 systemd/Nginx 파일이 예상 결과와 다르면 덮어쓰지 않고 실패한다.
- Nginx 전체 설정 트리에서 대상 도메인이 발견되면 어떤 파일도 만들기 전에 중단한다.
- `nuboctl`이 이전에 만든 동일한 파일은 변경 없이 보존하며 재실행해도 결과가 같다.

이 단계는 DB/관리자 placeholder를 자동 입력하지 않는다. systemd `daemon-reload`·enable·start,
Nginx enable·reload, Certbot/TLS도 하지 않는다. 환경 파일을 완성하고 `doctor`를 다시 실행한 뒤
후속 프로세스 제어 단계로 넘어간다.

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

- Linux amd64와 Ubuntu 22.04/24.04 여부
- CPU에 맞춰 자동 선택되는 내장 libvips 호환판·최적화판, Node `>=24.11.0 <27`, systemd, Nginx
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

`start`, `stop`, `restart`, `logs`, `update`, `rollback`은 아직 구현되지 않았다.
