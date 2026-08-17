# nuboctl 진단 명령

현재 `nuboctl` MVP는 Ubuntu 서버 상태를 읽기만 하는 `doctor`와 `status`를 제공한다. 설정 파일,
Nginx, systemd, 데이터베이스, 업로드 파일을 생성·수정·삭제하거나 서비스를 재시작하지 않는다.

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
- Node `>=24.11.0 <27`, libvips, systemd, Nginx
- `manifest.json` 대상 플랫폼과 컴포넌트 dirty 상태
- `checksums.txt`의 모든 항목과 release 밖 경로·심볼릭 링크 차단
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

`install`, `start`, `stop`, `restart`, `logs`, `update`, `rollback`은 아직 구현되지 않았다.
