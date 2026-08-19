# nuboctl source

이 디렉터리는 NUBO 서버의 설치·진단·업데이트를 담당하는 `nuboctl` 정적 바이너리의 Go 원본이다.
웹 애플리케이션이나 GOAPI의 일부가 아니며, 설치 대상 서버에서 이 소스를 빌드하거나 Go를 설치하지 않는다.

공식 릴리스 과정에서만 `scripts/build-nuboctl-linux.sh`가 이 코드를 Linux amd64 바이너리 하나로
컴파일한다. 완성된 바이너리는 GOAPI, libvips, Nuxt output과 함께 통합 release asset에 포함된다.
운영자는 다음 명령으로 검증된 asset과 바이너리를 사용한다.

```bash
npm run server:install
npm run server:update
```

이 소스를 NUBO 저장소에 두는 이유는 설치기가 `deploy/`의 systemd·Nginx 템플릿, 릴리스 manifest,
readiness와 update 계약을 NUBO 버전과 함께 변경하고 검증해야 하기 때문이다. GOAPI 저장소에는 HTTP API와
DB migration 구현만 둔다.

설치기 자체를 수정할 때만 이 디렉터리에서 다음 검증을 실행한다.

```bash
go test ./...
go test -race ./...
go vet ./...
```
