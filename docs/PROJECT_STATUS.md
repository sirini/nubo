# NUBO project status

## Active goal

- 좁아진 제품 범위에 맞춰 `nuboctl`을 읽기 쉽게 정리하고, 모든 prebuilt 설정이 런타임에 반영되도록 고친다.
- 한국어 사용자는 대화형 설치를, AI·자동화는 문서화된 비대화형 설치를 사용하도록 설치 계약을 다듬는다.

## Current product boundary

- 대상: 직접 서버를 운영하는 한국어권 개인·소규모 커뮤니티 운영자.
- 지원: Ubuntu 22.04/24.04 amd64 단일 서버, systemd, Nginx, Node.js, MySQL/MariaDB, no-build prebuilt.
- 제외: 컨테이너, Kubernetes, 다중 배포판, 다국어 CLI, 복잡한 릴리스 채널, 범용 배포 추상화.
- 장기 로드맵은 아이디어 지도이며 현재 작업은 이 문서의 작은 목표를 우선한다.

## Decisions

- `nuboctl`은 범용 배포판 검증기가 아니라 NUBO의 최소 실행 환경을 준비하고 문제 해결 방법을 안내한다.
- checksum에 기록된 파일의 손상과 위험한 경로는 검사하지만, 목록에 없는 추가 파일까지 거부하지 않는다.
- 새 업로드 경로는 서비스 계정 소유로 만들고, 기존 경로는 변경하지 않은 채 실제 쓰기 권한을 사전 검사한다.
- 기존 환경·systemd·Nginx 파일은 보존하고 예상 내용과 다르면 덮어쓰지 않는다.
- 사람용 `install`은 한국어 대화형을 기본으로 하고, 비대화형 모드는 비밀값을 CLI 인자가 아닌 제한된 입력 파일로 받는다.
- DB/bootstrap, 서비스 활성화, Nginx reload, TLS는 준비 단계와 분리한 뒤 각각 실제 설치 흐름으로 연결한다.
- 설정과 업로드는 릴리스 밖에 보존하며, 운영 서버에서는 `npm install`이나 Nuxt 빌드를 하지 않는다.

## Recent completion

- `.output`, 공식 Ubuntu 22.04 GOAPI, 환경 샘플, 서비스 템플릿, manifest/checksum, 정적 `nuboctl`을 묶는 통합 릴리스를 검증했다.
- 읽기 전용 `doctor`/`status`와 덮어쓰기 없는 `install` 준비 단계를 구현했다.
- GOAPI와 Nuxt가 릴리스 외부의 한 환경 파일을 사용하고 업로드 루트를 독립적으로 지정하도록 했다.

## Open findings

- 중첩된 Nuxt 설정의 환경 변수 이름이 런타임 계약과 맞지 않아 일부 값이 prebuilt 빌드 시점에 고정된다.
- `install.go`와 단일 테스트 파일이 길고 대부분의 함수에 이해를 돕는 한국어 주석이 없다.
- 현재 `install`은 DB 준비, 서비스 활성화, readiness, 최초 관리자 안내까지 수행하지 않는다.
- 전체 NUBO ESLint에는 완료된 작업 밖의 기존 358건이 남아 있다.

## Verification

- 현재 `nuboctl`: `go test ./...`, `go test -race ./...`, `go vet ./...` 통과.
- 기존 prebuilt: Node 24/26 및 Ubuntu 22.04/24.04 smoke 통과.

## Next action

- 문서 범위 확정 후 런타임 설정·checksum·업로드 검사를 바로잡고 코드와 테스트를 의미 단위로 나눈다.
- 이어서 한국어 대화형 설치와 번들 최상위의 AI 설치 가이드를 구현한다.
