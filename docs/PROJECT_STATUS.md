# NUBO project status

## Active goal

- 좁아진 제품 범위에서 새 `nuboctl install` 흐름을 실제 Ubuntu 서버 QA로 이어간다.
- DB 준비, 서비스 활성화, readiness 확인을 각각 작고 검증 가능한 후속 작업으로 정한다.

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
- 공식 릴리스는 sharp-libvips를 포함하고 상대 경로로 읽으며, 운영 서버에 시스템 libvips를 설치하지 않는다.
- 현재 x86-64 릴리스는 sharp와 같은 SSE4.2 CPU를 최소 조건으로 삼는다.

## Recent completion

- 모든 Nuxt 공개 설정과 문서 제목이 prebuilt 실행 시 환경 파일에서 바뀌도록 런타임 계약을 바로잡았다.
- `nuboctl` 구현과 테스트를 210줄 이하의 의미 단위 파일로 나누고 함수 주석을 짧은 한국어로 정리했다.
- checksum 목록 밖의 일반 파일은 허용하되 기록된 파일과 위험 경로는 검증하며, 기존 업로드 경로의 쓰기 권한을 확인한다.
- 한국어 대화형 설치와 비밀 입력 파일 기반 비대화형 설치, 번들 최상위 AI 설치 가이드를 추가했다.
- govips 2.18과 sharp-libvips 1.3.2(libvips 8.18.3)를 결합해 시스템 libvips 의존성을 제거했다.

## Open findings

- 현재 `install`은 DB 준비, 서비스 활성화, readiness 완료 확인까지 수행하지 않는다.
- 새 설치 흐름은 실제 깨끗한 Ubuntu 서버에서 운영자 관점의 QA가 필요하다.
- 전체 NUBO ESLint에는 완료된 작업 밖의 기존 358건이 남아 있다.

## Verification

- `nuboctl`: `go test ./...`, race, vet 통과; 내장 libvips와 SSE4.2 진단을 Ubuntu 22.04에서 확인했다.
- NUBO: 11개 테스트, typecheck, production build 통과.
- prebuilt: 시스템 libvips가 없는 Ubuntu 22.04/24.04 이미지 변환 테스트와 통합 릴리스 빌드 통과.

## Next action

- 실제 Ubuntu 서버에서 대화형 설치 준비와 오류 안내를 QA한다.
- QA 결과를 바탕으로 DB 준비와 서비스 활성화 중 다음 한 단계를 확정한다.
