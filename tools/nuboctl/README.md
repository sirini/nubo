# nuboctl source

이 디렉터리는 NUBO 서버의 설치·진단·업데이트를 담당하는 `nuboctl` 정적 바이너리의 Go 원본이다.
웹 애플리케이션이나 GOAPI의 일부가 아니며, 설치 대상 서버에서 이 소스를 빌드하거나 Go를 설치하지 않는다.

공식 릴리스 과정에서만 `scripts/build-nuboctl-linux.sh`가 이 코드를 Linux amd64 바이너리 하나로
컴파일한다. 완성된 바이너리는 GOAPI, libvips, Nuxt output과 함께 통합 release asset에 포함된다.
운영자는 다음 명령으로 검증된 asset과 바이너리를 사용한다.

```bash
npm run server:install
npm run server:adopt
nuboctl update
nuboctl releases list
```

최초 설치와 구버전 adoption은 PATH에 `nuboctl`이 아직 없으므로 npm bootstrap 명령을 사용한다.
설치가 끝난 뒤의 상태 확인, 진단, 업데이트와 사이트 스킨 빌드는 `nuboctl`로 통일한다. 한 번
`nuboctl customize`로 등록한 사이트 스킨은 이후 `nuboctl update`가 소스 fast-forward, 공식 릴리스
전환과 새 버전용 스킨 재적용까지 처리한다. 기존 `server:update`와 `server:customize` npm script는
자동화 호환을 위해 남겨 둔다.

`nuboctl releases list/prune`은 불변 릴리스 보관함을 확인하고 안전하게 정리한다. 실제 삭제 전에
`current`, `previous`, 커스텀 빌드의 공식 기반과 최신 예비 릴리스를 보호하고 나머지 후보의 전체
checksum을 검증한다. 운영자는 항상 `prune --dry-run` 결과를 먼저 확인한다.

`nuboctl market search/info/install/remove`는 공식 Market에서 스킨을 찾고 checksum과 압축 경로를
검증해 현재 소스 checkout에 설치한다. 설치 영수증과 파일 checksum이 모두 일치하는 스킨만 삭제하며,
각 작업은 `nuboctl market help`에서 확인할 수 있다. 기존 `skin search/info/install`은 호환 별칭이다.

이 소스를 NUBO 저장소에 두는 이유는 설치기가 `deploy/`의 systemd·Nginx 템플릿, 릴리스 manifest,
readiness와 update 계약을 NUBO 버전과 함께 변경하고 검증해야 하기 때문이다. GOAPI 저장소에는 HTTP API와
DB migration 구현만 둔다.

설치기 자체를 수정할 때만 이 디렉터리에서 다음 검증을 실행한다.

```bash
go test ./...
go test -race ./...
go vet ./...
```
