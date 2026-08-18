# NUBO project status

## Active goal

- install→activate-nginx→TLS→update 흐름을 깨끗한 Ubuntu와 Cafe24에서 통합 QA한다.

## Current product boundary

- 대상: 직접 서버를 운영하는 한국어권 개인·소규모 커뮤니티 운영자.
- 지원: Ubuntu 22.04 이상 amd64, Node.js 22 이상인 단일 서버, systemd, Nginx, MySQL/MariaDB, no-build prebuilt.
- 제외: 컨테이너, Kubernetes, 다중 배포판, 다국어 CLI, 복잡한 릴리스 채널, 범용 배포 추상화.
- 장기 로드맵은 아이디어 지도이며 현재 작업은 이 문서의 작은 목표를 우선한다.

## Decisions

- `nuboctl`은 범용 배포판 검증기가 아니라 NUBO의 최소 실행 환경을 준비하고 문제 해결 방법을 안내한다.
- checksum에 기록된 파일의 손상과 위험한 경로는 검사하지만, 목록에 없는 추가 파일까지 거부하지 않는다.
- 새 업로드 경로는 서비스 계정 소유로 만들고, 기존 경로는 변경하지 않은 채 실제 쓰기 권한을 사전 검사한다.
- 기존 환경·systemd·Nginx 파일은 보존하고 예상 내용과 다르면 덮어쓰지 않는다.
- 사람용 `install`은 한국어 대화형을 기본으로 하고, 비대화형 모드는 비밀값을 CLI 인자가 아닌 제한된 입력 파일로 받는다.
- DB bootstrap과 systemd readiness는 `install`에 연결하고 Nginx reload와 TLS는 별도 단계로 둔다.
- `activate-nginx`는 설치기가 만든 site의 HTTP 공개만 담당하고 Certbot/TLS는 운영자 통제에 둔다.
- 버전 릴리스는 불변 디렉터리에 두고 systemd는 `current` 링크만 참조한다.
- update는 외부 백업을 전제로 additive migration→원자적 링크 전환→restart/readiness 순서로 수행한다.
- readiness 실패 시 이전 링크와 프로세스는 복원하지만 DB migration은 되돌리지 않는다.
- update는 같은 releases 디렉터리의 더 높은 정식 버전과 동일 운영 템플릿만 자동 전환한다.
- 설정과 업로드는 릴리스 밖에 보존하며, 운영 서버에서는 `npm install`이나 Nuxt 빌드를 하지 않는다.
- 공식 릴리스는 sharp-libvips를 포함하고 상대 경로로 읽으며, 운영 서버에 시스템 libvips를 설치하지 않는다.
- x86-64 호환판을 기본 경로에, sharp 공식 x86-64-v2판을 glibc-hwcaps 경로에 함께 둔다.
- CPU 판별과 선택은 glibc에 맡기며 `nuboctl`은 SSE4.2가 없다는 이유로 설치를 거부하지 않는다.
- Ubuntu와 Node.js는 각각 22.04와 22라는 최소 기준만 두고 이후 버전에 별도 상한이나 허용 목록을 두지 않는다.
- 최소 기준 이후의 실제 호환성은 설치 전후 doctor와 서비스 readiness 결과로 판단한다.

## Recent completion

- 모든 Nuxt 공개 설정과 문서 제목이 prebuilt 실행 시 환경 파일에서 바뀌도록 런타임 계약을 바로잡았다.
- `nuboctl` 구현과 테스트를 210줄 이하의 의미 단위 파일로 나누고 함수 주석을 짧은 한국어로 정리했다.
- checksum 목록 밖의 일반 파일은 허용하되 기록된 파일과 위험 경로는 검증하며, 기존 업로드 경로의 쓰기 권한을 확인한다.
- 한국어 대화형 설치와 비밀 입력 파일 기반 비대화형 설치, 번들 최상위 AI 설치 가이드를 추가했다.
- govips 2.18과 sharp-libvips 1.3.2(libvips 8.18.3)를 결합해 시스템 libvips 의존성을 제거했다.
- sharp-libvips 고정 소스의 x86-64 호환판과 공식 x86-64-v2판을 함께 배포하고 glibc가 자동 선택하게 했다.
- 외부 환경 파일로 DB·기본 관리자·게시판·최신 스키마를 멱등적으로 준비하도록 `nuboctl install`을 연결했다.
- `nubo.target`을 부팅 자동 시작하고 Nuxt `/ready`가 GOAPI·DB까지 정상인지 확인하게 했다.
- 별도 `activate-nginx`로 site 링크, 전체 설정 검사, Nginx enable/start/reload를 멱등적으로 수행한다.
- install이 검증·DB 준비용 버전 디렉터리와 서비스용 `current` 링크를 분리하도록 바로잡았다.
- update가 checksum·환경·unit·readiness를 preflight하고 migration·버전 환경·current를 전환하며 실패 시 복구한다.
- 설치 정책을 Ubuntu 22.04 이상과 Node.js 22 이상이라는 두 하한선으로 단순화했다.

## Open findings

- Certbot 설치·약관·인증서 발급과 HTTPS redirect는 운영자가 수행한다.
- update는 릴리스 다운로드·압축 해제, 데이터 백업·복원을 수행하지 않는다.
- 실제 MySQL/MariaDB를 사용한 fresh DB·기존 DB 통합 검증은 서버 QA 때 확인해야 한다.
- 새 설치 흐름은 실제 깨끗한 Ubuntu 서버에서 운영자 관점의 QA가 필요하다.
- Cafe24의 실제 `cpu64-rhel6` 가상 CPU에서 호환판 이미지 처리 최종 QA가 필요하다.
- 전체 NUBO ESLint에는 완료된 작업 밖의 기존 358건이 남아 있다.

## Verification

- `nuboctl`: 테스트, race, vet 통과; systemd 명령 순서와 readiness 응답, SSE4.2 없는 CPU 안내를 확인했다.
- Nginx 활성화: 실행/정지 서비스 분기, 재실행 멱등성, 충돌 보호, 설정 실패 시 새 링크 rollback 테스트 통과.
- current 링크: 신규 생성·재실행 보존·다른 대상/일반 경로 충돌 보호·unit 안정 경로 사용 테스트 통과.
- update: 상위 버전 제한, 동시 실행 잠금, 템플릿 충돌, dry-run/취소/migration 실패, 성공 전환과 readiness 실패 복구 테스트 통과.
- DB bootstrap: 외부 관리자 설정 로딩, DB 식별자 보호, nuboctl 실행·오류 전달 테스트 통과.
- NUBO: Node.js 22.23.2에서 11개 테스트, typecheck, production build 통과.
- GOAPI: Ubuntu 22.04/24.04에서 최적화판, QEMU `qemu64`에서 호환판 JPEG→WebP 변환 통과.
- prebuilt: Node.js 22.23.2에서 런타임 설정·health/readiness·SSR·프록시 smoke test를 통과했고, 두 libvips 변형·출처·checksum·x86-64-v2 자동 선택과 통합 릴리스도 검증했다.

## Next action

- 후보 릴리스 두 버전을 빌드해 깨끗한 Ubuntu에서 install→activate-nginx→TLS→update를 검증한다.
- 같은 흐름과 baseline 이미지 처리를 Cafe24 `cpu64-rhel6` 서버에서 최종 확인한다.
