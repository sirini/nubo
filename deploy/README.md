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

systemd unit은 journal에 로그를 남기고 내부 `nubo.target`으로 묶이며, 운영자는 대표
`nubo.service`를 통해 `systemctl restart nubo`처럼 전체를 제어한다. `nubo-web.service`는 GOAPI 뒤에
시작하지만 두 프로세스는 각각 재시작할 수도 있다. unit의 릴리스 경로는 버전 디렉터리가 아니라
`/opt/nubo/current` 링크로 고정해 이후 원자적인 릴리스 전환이 가능해야 한다.
설치기는 두 애플리케이션 unit에 `nubo-lifecycle.conf` drop-in을 추가해 `PartOf=nubo.service`를
직접 설정한다. `PropagatesStopTo=`만으로는 대표 unit의 restart가 이미 실행 중인 하위 서비스에
전파되지 않으므로 이 drop-in을 제거하지 않는다.

### 기존 adoption 서버에서 대표 service 추가

대표 `nubo.service`가 없는 과거 adoption 서버는 새 lifecycle 릴리스로 update하면 GOAPI·Web drop-in은
자동으로 추가되지만 대표 unit 자체는 설치하지 않는다. 운영자가 대표 명령을 사용하려면 update 뒤
다음 절차를 한 번만 실행한다. drop-in 재설치는 같은 내용일 때 멱등적이다.

```bash
sudo install -m 0644 /opt/nubo/current/share/systemd/nubo.service /etc/systemd/system/nubo.service
sudo install -d -m 0755 /etc/systemd/system/nubo-goapi.service.d /etc/systemd/system/nubo-web.service.d
sudo install -m 0644 /opt/nubo/current/share/systemd/nubo-lifecycle.conf /etc/systemd/system/nubo-goapi.service.d/nubo-lifecycle.conf
sudo install -m 0644 /opt/nubo/current/share/systemd/nubo-lifecycle.conf /etc/systemd/system/nubo-web.service.d/nubo-lifecycle.conf
sudo systemctl daemon-reload
sudo systemctl disable nubo.target
sudo systemctl enable --now nubo.service
```

이 과정은 이미 실행 중인 GOAPI·Web을 재시작하지 않는다. 이후 전체 lifecycle은
`sudo systemctl restart nubo`로 제어하며 내부 `nubo.target` 파일은 호환성을 위해 삭제하지 않는다.
새 lifecycle drop-in을 포함한 릴리스로 update할 때는 `nuboctl`이 같은 파일을 기존 unit을
덮어쓰지 않고 자동으로 추가한다.
