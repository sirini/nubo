# NUBO Linux 서비스 템플릿

이 파일들은 `nuboctl install`이 사용하는 입력 템플릿이다. 모든 `@TOKEN@`이 치환되기 전에는
`/etc`에 직접 복사하지 않는다. 최소 지원 환경은 Ubuntu 22.04 amd64와 Node.js 22이며 이후 버전에는 별도 상한을 두지 않는다.
GOAPI용 libvips와 이미지 코덱은 공식 릴리스의 `lib/`에 포함되며 별도 시스템 패키지가 필요 없다.

릴리스 최상위의 `nuboctl install`은 unit을 렌더링하고 systemd 서비스를 활성화하지만 Nginx는 별도
`activate-nginx` 명령 전까지 활성화·reload하지 않는다.
사람은 한국어 대화형 설치를, AI·자동화는 `INSTALL_GUIDE_FOR_AI.md`의 비대화형 설치를 사용한다.

기본값:

| Token | Default |
| --- | --- |
| `@NUBO_USER@` | `nubo` |
| `@NUBO_GROUP@` | `nubo` |
| `@NUBO_RELEASE_DIR@` | `/opt/nubo/current` |
| `@NUBO_STATE_DIR@` | `/var/lib/nubo` |
| `@NUBO_UPLOAD_DIR@` | `/var/lib/nubo/upload` |
| `@NUBO_ENV_FILE@` | `/etc/nubo/nubo.env` |
| `@NODE_BINARY@` | discovered absolute Node path, commonly `/usr/bin/node` |
| `@NUBO_DOMAIN@` | the site's public host name |
| `@NUBO_WEB_PORT@` | `3000` |
| `@NUBO_GOAPI_PORT@` | `3006` |
| `@NUBO_GOAPI_PATH@` | `goapi` |
| `@NUBO_MAX_BODY_SIZE@` | `100m` or another Nginx-compatible size |

기존 업로드 경로도 `@NUBO_UPLOAD_DIR@=/var/www/nubohub.org/upload`처럼 직접 사용할 수 있다.
GOAPI unit, Nginx, `nubo.env`에는 같은 절대 경로를 사용한다. NUBO 서비스 사용자는 쓰기 권한이,
Nginx 사용자는 읽기와 상위 경로 통과 권한이 필요하다. 설치 도구는 기존 경로의 소유권을 임의로 바꾸지 않는다.

현재 지원하는 reverse proxy는 Nginx뿐이다. 새 서버에서는 설치 도구가 site 설정을 만들지만 아직
enable이나 reload하지 않는다. 대상 도메인의 기존 설정이 있으면 수정·활성화·비활성화하지 않고 충돌 위치를 알린다.

systemd unit은 journal에 로그를 남기고 `nubo.target`으로 묶인다. `nubo-web.service`는 GOAPI 뒤에
시작하지만 두 프로세스는 각각 재시작할 수 있다. unit의 릴리스 경로는 버전 디렉터리가 아니라
`/opt/nubo/current` 링크로 고정해 이후 원자적인 릴리스 전환이 가능해야 한다.
