# NUBO project status

## Active goal

- v1.2.8 통합 배포 이후 실제 Ubuntu 서버 QA를 진행한다.

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
- Git에는 실행 바이너리와 통합 압축본을 넣지 않고, 고정된 GOAPI commit으로 만든 GitHub Release asset 하나를 사용한다.
- `npm run server:prepare`, `server:install`, `server:update`는 같은 asset과 외부 SHA-256을 검증해 사용한다.
- x86-64 호환판을 기본 경로에, sharp 공식 x86-64-v2판을 glibc-hwcaps 경로에 함께 둔다.
- CPU 판별과 선택은 glibc에 맡기며 `nuboctl`은 SSE4.2가 없다는 이유로 설치를 거부하지 않는다.
- Ubuntu와 Node.js는 각각 22.04와 22라는 최소 기준만 두고 이후 버전에 별도 상한이나 허용 목록을 두지 않는다.
- 최소 기준 이후의 실제 호환성은 설치 전후 doctor와 서비스 readiness 결과로 판단한다.
- 호환성을 깨지 않는 통합 배포 구조 개편은 1.2 라인을 유지하고 정식 버전 v1.2.2로 배포한다.
- adoption은 기존 소스·환경·업로드·DB·Nginx를 제자리 보존하고 새 릴리스·환경 사본·systemd만 추가한다.
- 기존 프로젝트 소유 계정을 서비스 계정으로 재사용하며 이후 update는 설치된 unit에서 계정을 자동 감지한다.
- adoption은 프로세스 관리 방식을 추측하지 않고 포트 점유만 안내·차단하며 종료와 재시작은 운영자에게 맡긴다.
- root-only VPS의 기존 운영을 차단하지 않으며 root 서비스에는 systemd 샌드박스 유지 경고를 표시한다.
- 백업 안내 후 Enter는 진행, 다른 문자열은 취소로 처리한다.
- 설치 readiness는 Nuxt의 `ok`와 GOAPI의 `ready` 상태를 모두 정상으로 인정한다.
- `nubo.service`는 기존 `nubo.target`을 감싸며 GOAPI·Web의 독립 unit 구조를 바꾸지 않는다.
- 이미 adoption한 서버의 systemd unit은 update가 자동 변경하지 않고 운영자가 선택적으로 대표 unit을 설치한다.

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
- 추적하던 `goapi-linux`를 제거하고 통합 릴리스 다운로드·검증·배치 명령과 태그 기반 게시 workflow를 추가했다.
- `v1.2.1-rc.1` 통합 asset과 SHA-256을 GitHub prerelease로 게시해 새 전달 경로를 활성화했다.
- 로컬 GOAPI 준비 명령도 서버 전달 명명 규칙에 맞춰 `npm run server:prepare`로 통일했다.
- 모든 원격 브랜치와 태그를 보존하면서 과거 `goapi-linux`·`goapi-linux-x86` 객체를 Git 이력에서 제거했다.
- 통합 배포 구조 개편을 정식 v1.2.2로 표기하고 통합 asset과 SHA-256을 게시했다.
- 기존 v1.2.0 소스·PM2 설치를 보존형 prebuilt·systemd 체제로 옮기는 `npm run server:adopt`를 v1.2.3으로 게시했다.
- adoption이 기존 프로세스를 조작하지 않고 포트 점유만 안내·차단하도록 단순화한 v1.2.4를 게시했다.
- root-only VPS의 기존 checkout을 경고와 systemd 샌드박스로 수용하는 v1.2.5를 게시했다.
- DB bootstrap 검증 이름을 실제 `user_black_list` 스키마와 일치시키고 adoption 백업 확인을 Enter 방식으로 단순화한 v1.2.6을 게시했다.
- Nuxt의 정상 `status: ok` 응답을 설치기가 거부하던 readiness 판정 오류를 수정한 v1.2.7을 게시했다.
- 새 설치·adoption이 대표 `nubo.service`를 활성화해 전체 lifecycle 명령을 짧게 제공하는 v1.2.8을 게시했다.
- README와 AI/nuboctl 가이드를 현재 prebuilt 설치·adoption·update·Enter 백업 확인·`systemctl restart nubo` 흐름에 맞췄다.
- NUBO와 GOAPI README에서 Ubuntu 22.04+ x86-64의 통합 prebuilt 운영 경로를 우선 안내하고, macOS·다른 Linux·Windows/WSL2의 소스 시험 경계를 정리했다.

## Open findings

- Certbot 설치·약관·인증서 발급과 HTTPS redirect는 운영자가 수행한다.
- 하위 `nuboctl update`는 데이터 백업·복원을 수행하지 않으며 npm wrapper도 외부 백업 확인을 유지한다.
- 실제 MySQL/MariaDB를 사용한 fresh DB·기존 DB 통합 검증은 서버 QA 때 확인해야 한다.
- 새 설치 흐름은 실제 깨끗한 Ubuntu 서버에서 운영자 관점의 QA가 필요하다.
- Cafe24의 실제 `cpu64-rhel6` 가상 CPU에서 호환판 이미지 처리 최종 QA가 필요하다.
- 전체 NUBO ESLint에는 완료된 작업 밖의 기존 358건이 남아 있다.
- 바이너리 제거 전 clone은 재작성된 원격 이력과 섞지 말고 새로 clone해야 한다.
- GitHub hosted Ubuntu 22 러너의 Vite 8 클라이언트 변환이 진행되지 않아 v1.2.2는 같은 태그·스크립트를 사용한 로컬 Node 22 깨끗한 clone에서 검증·게시했다.
- adoption dry-run은 포트 점유를 안내하고, 실제 실행은 기존 프로세스를 임의 종료하지 않은 채 점유 포트가 있으면 변경 전에 중단한다.
- v1.2.7까지 adoption한 서버는 대표 `nubo.service`를 원할 때 문서의 수동 절차로 추가한다.

## Verification

- README의 설치·업데이트·소스 빌드 명령을 package scripts, Go module 요구 버전, govips의 플랫폼 요구사항과 대조했다.

- `nuboctl`: 테스트, race, vet 통과; systemd 명령 순서와 readiness 응답, SSE4.2 없는 CPU 안내를 확인했다.
- Nginx 활성화: 실행/정지 서비스 분기, 재실행 멱등성, 충돌 보호, 설정 실패 시 새 링크 rollback 테스트 통과.
- current 링크: 신규 생성·재실행 보존·다른 대상/일반 경로 충돌 보호·unit 안정 경로 사용 테스트 통과.
- update: 상위 버전 제한, 동시 실행 잠금, 템플릿 충돌, dry-run/취소/migration 실패, 성공 전환과 readiness 실패 복구 테스트 통과.
- DB bootstrap: 외부 관리자 설정 로딩, DB 식별자 보호, nuboctl 실행·오류 전달 테스트 통과.
- NUBO: Node.js 22.23.2에서 11개 테스트, typecheck, production build 통과.
- GOAPI: Ubuntu 22.04/24.04에서 최적화판, QEMU `qemu64`에서 호환판 JPEG→WebP 변환 통과.
- prebuilt: Node.js 22.23.2에서 런타임 설정·health/readiness·SSR·프록시 smoke test를 통과했고, 두 libvips 변형·출처·checksum·x86-64-v2 자동 선택과 통합 릴리스도 검증했다.
- 릴리스 전달: `.tar.gz`·외부 SHA-256 생성과 Ubuntu 24 재해제, 로컬 HTTP 다운로드·캐시·GOAPI 상대 RPATH, 깨끗한 Ubuntu 22/Node 22의 `server:install --dry-run`을 검증했다.
- 원격 전달: node_modules 없는 shallow clone(약 3.1 MiB Git metadata)에서 prerelease 다운로드와 GOAPI 준비를 통과했고, `/opt` 배치본이 root 소유임을 확인했다.
- Git 정리: 전체 브랜치·태그에서 과거 바이너리 경로가 0건이며 새 full clone의 `.git`은 약 11 MiB이다. 새 RC commit으로 asset과 SHA-256도 다시 게시했다.
- v1.2.2: Node 22/npm 10 깨끗한 설치·빌드, Ubuntu 22 GOAPI, libvips 호환판·x86-64-v2판, `nuboctl`, prebuilt smoke, 내부·외부 checksum과 원격 `server:prepare`를 통과했다.
- adoption: v1.2.0 환경 참조·경로 변환, 버전값 교체, dry-run 무변경, 기존 관리 설치 거부, 포트 점유 감지·NVM Node 경로와 서비스 활성 상태 확인 테스트를 통과했다.
- v1.2.3 후보: nuboctl test/race/vet, Node 15개 테스트, typecheck와 Vite 8 production build를 통과했다.
- v1.2.3 전달: 고정 GOAPI commit으로 통합 asset을 빌드해 내부·외부 checksum과 prebuilt smoke를 통과했고, 정식 Release와 새 shallow clone의 원격 `server:prepare`·manifest를 확인했다.
- v1.2.4 후보: PM2 자동 제어 제거, 점유 포트 dry-run 안내와 실제 운영 전환 전 차단 테스트, nuboctl test/race/vet, Node 15개 테스트, typecheck와 production build를 통과했다.
- v1.2.4 전달: 고정 GOAPI·두 libvips 변형으로 통합 asset과 SHA-256을 게시하고 새 shallow clone에서 원격 `server:prepare`, nuboctl 0.9.1 manifest와 PM2 옵션 제거를 확인했다.
- v1.2.5 후보: root 소유 checkout 허용·샌드박스 경고 테스트, nuboctl test/race/vet, Node 15개 테스트, typecheck와 production build를 통과했다.
- v1.2.5 전달: 통합 asset·SHA-256·prebuilt smoke를 통과하고 새 shallow clone에서 원격 `server:prepare`와 nuboctl 0.9.2 manifest를 확인했다.
- v1.2.6 후보: 실제 스키마 이름 회귀 테스트와 Enter 진행·문자열 취소 백업 입력 테스트를 통과했다.
- v1.2.6 전달: 고정 GOAPI 수정 커밋으로 통합 asset·SHA-256·prebuilt smoke를 통과하고 새 shallow clone의 원격 `server:prepare`에서 nuboctl 0.9.3과 manifest를 확인했다.
- v1.2.7 후보: Nuxt `ok`와 GOAPI `ready` readiness 상태를 모두 수용하는 회귀 테스트를 추가했다.
- v1.2.7 전달: 통합 asset·SHA-256·prebuilt smoke를 통과하고 새 shallow clone의 원격 `server:prepare`에서 nuboctl 0.9.4와 manifest를 확인했다.
- v1.2.8 후보: systemd unit 정적 검증, 대표 service 렌더링·활성화·기존 릴리스 update 호환 테스트, nuboctl test/race/vet와 NUBO test/typecheck/build를 통과했다.
- v1.2.8 전달: 통합 asset·SHA-256·prebuilt smoke를 통과하고 새 shallow clone의 원격 `server:prepare`에서 nuboctl 0.9.5와 대표 unit을 확인했다.
- Ubuntu 24.04의 systemd 255 컨테이너에서 `nubo.service`와 `nubo.target` unit 구문 검증을 통과했다.

## Next action

- 기존 Cafe24 서버를 v1.2.8로 update한 뒤 문서의 수동 절차로 대표 service lifecycle을 확인한다.
- 깨끗한 Ubuntu와 Cafe24에서 install→activate-nginx→TLS→update 및 baseline 이미지 처리를 최종 확인한다.
