# NUBO project status

## Active goal

- checkout 없는 publish job에서도 저장소를 명시해 검증된 통합 자산을 v1.2.15로 게시한다.

## Current product boundary

- 대상: 직접 서버를 운영하는 한국어권 개인·소규모 커뮤니티 운영자.
- 지원: Ubuntu 22.04 이상 amd64, Node.js 22 이상인 단일 서버, systemd, Nginx, MySQL/MariaDB, no-build prebuilt.
- 제외: 컨테이너, Kubernetes, 다중 배포판, 다국어 CLI, 복잡한 릴리스 채널, 범용 배포 추상화.
- 장기 로드맵은 아이디어 지도이며 현재 작업은 이 문서의 작은 목표를 우선한다.

## Decisions

- API contract version은 NUBO JSON과 GOAPI embedded text를 각 저장소의 machine-readable source로 두고 릴리스 전에 반드시 일치시킨다.
- 릴리스 CI는 전체 lint 부채와 분리해 NUBO test/typecheck/build, GOAPI 공식 빌드 환경의 test/vet, contract 일치를 게시 전 필수 게이트로 실행한다.
- 전체 ESLint 오류는 게시 전에 차단하고, 기존 의미 판단 경고 50건을 상한으로 고정해 새 경고가 늘어나지 않게 한다.
- fresh-install CI는 단계별 진행을 출력하고 외부 명령과 job 전체에 제한 시간을 둬 정지한 runner가 게시를 무기한 막지 않게 한다.
- optional prop·sanitize된 HTML lint 경고 50건은 현재 동작을 바꿀 필수 사유가 없어 보류하고 새 경고 증가만 막는다.
- 운영자 백업은 SFTP와 `mysqldump`/`mariadb-dump` 등 표준 도구에 맡기며 별도 백업·복구 제품이나 상세 자동화를 만들지 않는다.
- 정식 릴리스 채널 체계나 compatibility matrix 대신 필요한 patch를 게시하고 `git pull --ff-only` 후 `nuboctl update`로 빠르게 적용한다.
- `nuboctl doctor`는 현재의 실행 환경·릴리스·권한·readiness 진단을 완료 범위로 두고 도메인·SSL·Nginx·메일은 AI와 운영 가이드에 맡긴다.
- fresh-install smoke는 일회용 Ubuntu 22.04/24.04 runner에서 로컬 MySQL/MariaDB를 준비하고 릴리스 설치·systemd 기동·`/ready`·`/version`만 검증하며 Nginx 활성화, TLS, 메일, 외부 DB와 update는 제외한다.
- Nitro 시작 시 GOAPI contract를 확인하되 정상 부팅 중 연결 지연이나 불일치가 Web 기동 자체를 막지는 않으며, 구조화 경고와 지속 `/ready`·`/version` 진단으로 처리한다.
- `nuboctl`은 범용 배포판 검증기가 아니라 NUBO의 최소 실행 환경을 준비하고 문제 해결 방법을 안내한다.
- checksum에 기록된 파일의 손상과 위험한 경로는 검사하지만, 목록에 없는 추가 파일까지 거부하지 않는다.
- 새 업로드 경로는 서비스 계정 소유로 만들고, 기존 경로는 변경하지 않은 채 systemd가 실제 적용한 서비스 계정의 쓰기 권한을 검사한다.
- 기존 환경·systemd·Nginx 파일은 보존하고 예상 내용과 다르면 덮어쓰지 않는다.
- 사람용 `install`은 한국어 대화형을 기본으로 하고, 비대화형 모드는 비밀값을 CLI 인자가 아닌 제한된 입력 파일로 받는다.
- DB bootstrap과 systemd readiness는 `install`에 연결하고 Nginx reload와 TLS는 별도 단계로 둔다.
- `activate-nginx`는 설치기가 만든 site의 HTTP 공개만 담당하고 Certbot/TLS는 운영자 통제에 둔다.
- 버전 릴리스는 불변 디렉터리에 두고 systemd는 `current` 링크만 참조한다.
- update는 외부 백업을 전제로 additive migration→원자적 링크 전환→restart/readiness 순서로 수행한다.
- readiness 실패 시 이전 링크와 프로세스는 복원하지만 DB migration은 되돌리지 않는다.
- update는 같은 releases 디렉터리의 더 높은 정식 버전과 동일 운영 템플릿만 자동 전환한다.
- 설정과 업로드는 릴리스 밖에 보존하며, Standard Mode는 운영 서버에서 npm 설치나 Nuxt 빌드를 하지 않는다.
- 공식 릴리스는 sharp-libvips를 포함하고 상대 경로로 읽으며, 운영 서버에 시스템 libvips를 설치하지 않는다.
- Git에는 실행 바이너리와 통합 압축본을 넣지 않고, 고정된 GOAPI commit으로 만든 GitHub Release asset 하나를 사용한다.
- `server:prepare`, 최초 `server:install`·`server:adopt`와 공개 `nuboctl update`는 같은 asset과 외부 SHA-256을 검증해 사용한다.
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
- update는 기존 base systemd unit을 자동 변경하지 않지만 대표 restart를 바로잡는 동일 내용의 additive lifecycle drop-in은 충돌이 없을 때 설치한다. 대표 unit 자체가 없는 과거 adoption 서버에서는 운영자가 선택적으로 설치한다.
- v1.2.0 이전 소스 설치의 adoption은 기존 checkout을 갱신하지 않고 옆 경로의 깨끗한 clone에 환경과 업로드를 복사한 뒤 진행한다.
- 커스텀 Vue 스킨은 빌드 시점 자산이며 `nuboctl customize`가 공식 기반과 로컬 Web을 별도 불변 파생 릴리스로 결합한다.
- `nuboctl skin apply`는 같은 공식 버전의 Web만 원자적으로 전환하고 readiness 실패 시 이전 Web을 복구하며 DB·GOAPI·환경은 바꾸지 않는다.
- install·adopt·update는 `/usr/local/bin/nuboctl`이 `current/nuboctl`을 따르게 하되 기존 다른 파일이나 링크를 덮어쓰지 않는다.
- 외부 스킨 카탈로그와 다운로드는 후속 범위로 두고, 현재는 사용자가 신뢰하는 로컬 스킨 소스만 다룬다.
- 저사양 가상 CPU의 Vite 8 변환 교착을 피하도록 Nuxt 4.5.2는 유지하고 Vite 해석만 `rolldown-vite@7.3.1`로 임시 고정한다.
- 최초 install·adopt만 npm bootstrap을 사용하고 설치 후 공개 명령은 `nuboctl`의 status·doctor·update·customize·activate-nginx로 통일한다.
- CLI 색상은 TTY에서만 사용하고 `NO_COLOR`와 `TERM=dumb`에서는 평문을 유지한다.
- 인자 없는 `nuboctl`, `help [명령]`과 `<명령> --help`는 같은 한국어 입문·명령별 안내를 제공한다.
- 대표 `nubo.service`의 restart는 GOAPI·Web에 직접 `PartOf=` 관계를 추가하고 기존 base unit을 덮어쓰지 않는 drop-in으로 보장한다.
- 자동 테스트는 인증·권한·데이터 손실·동시성·배포처럼 실패 비용이 큰 경계를 우선하며, 구현 세부를 반복하는 테스트는 늘리지 않는다.
- API contract v1은 기존 application 오류의 HTTP 200 + code 응답을 유지하며, HTTP status 의미 전환은 contract version을 올리는 단일 migration으로만 수행한다.
- 게시글 이동은 출발지와 목적지 양쪽의 게시판·그룹·전체 관리자 권한을 요구하고 거래 게시판은 범용 이동 대상에서 제외한다.

## Recent completion

- GOAPI에 Android FCM 설치 ID(FID)를 계정별로 등록·해제하는 `/push/device` 계약과 재실행 가능한 `push_device` 스키마를 추가했다. 댓글·좋아요·1:1 대화 알림은 Firebase Admin SDK로 즉시 전달하며 Firebase 설정이 없으면 알림 목록만 유지한다.
- GOAPI에 웹 쿠키 계약을 유지하면서 Android 앱이 refresh token을 원자적으로 회전할 수 있는 `/auth/android/refresh`를 추가했다.
- v1.2.14에서 NUBO·GOAPI 필수 게이트와 Ubuntu 22.04/24.04 fresh-install을 모두 통과해 hosted runner 호환성을 확인했다.
- ESLint 자동 수정 264건과 실제 오류 38건을 정리해 오류 0건으로 만들고, 전체 lint를 릴리스 게시 필수 게이트에 추가했다.
- 패키징 후보를 Ubuntu 22.04/24.04 별도 runner에 전달해 fresh install과 서비스 정상 상태를 확인한 뒤에만 GitHub Release를 게시하도록 연결했다.
- 릴리스 workflow가 NUBO test/typecheck/build, GOAPI test/vet와 양쪽 API contract 일치를 모두 통과해야 패키징·게시하도록 보강했다.
- S0-Q04를 완료해 `/version`에 release build identity와 호환성 진단을 노출하고, 관리자 경고와 비차단 startup contract 확인을 연결했다.
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
- 레거시 adoption을 새 clone·환경·업로드 복사·포트 종료 순서로 단순화하고, Nginx 업로드 경로와 커스텀 스킨 빌드/prebuilt 경계를 문서화했다.
- 로컬 스킨의 첫 의존성 준비·typecheck·build·checksum·파생 릴리스 전환을 `npm run server:customize` 한 명령으로 연결했다.
- v1.2.9 통합 asset과 SHA-256을 게시하고 install·adopt·update가 현재 `nuboctl`을 PATH에서 찾도록 연결했다.
- 로컬 스킨 빌드가 저사양 가상 CPU에서도 진행되도록 호환 Rolldown-Vite를 lockfile에 고정했다.
- 파생 릴리스 복사 시 Nitro의 내부 상대 심볼릭 링크를 그대로 보존해 checksum 검증이 원본 checkout을 외부 경로로 오인하지 않게 했다.
- 설치 후 업데이트와 사이트 꾸미기를 `nuboctl update`, `nuboctl customize`로 통일하고 단계·성공·주의·실패 출력을 읽기 쉽게 구분했다.
- nuboctl의 명령별 도움말을 보강하고 doctor/status가 adoption 서버의 실제 systemd 서비스 계정으로 업로드 쓰기 권한을 검사하게 했다.
- v1.2.10으로 버전을 올려 CLI 사용성·진단과 실서버 스킨 QA 수정사항을 하나의 패치 릴리스로 묶었다.
- v1.2.10 통합 asset과 SHA-256을 정식 GitHub Release로 게시했다.
- 새 install과 update가 GOAPI·Web lifecycle drop-in을 설치해 `systemctl restart nubo`를 실제 프로세스에 전파하도록 바로잡았다.
- 인증 코드의 이메일 결합·일회 소비, refresh token 원자적 회전, legacy SHA-256 로그인 시 bcrypt 전환, 활성 UID 1 최고관리자 경계를 최소 회귀 테스트로 고정했다.
- GOAPI 115개와 Nitro proxy 100개·직접/대체 경로 15개를 대조하고, 공통 응답·오류 code·HTTP status 예외를 API contract v1 문서와 JSON Schema로 고정했다.
- 누락된 그룹 관리자 변경 proxy를 추가하고, 게시글 이동의 PUT/POST 불일치를 바로잡았으며, 구현·호출부가 없는 dashboard latest proxy를 제거했다.
- 프런트의 명시적 `Resp<T>` 소비 지점을 GO result와 대조하고 응답을 성공/실패 discriminated union으로 고쳤으며, 게시판 설정의 누락된 `levelWrite` request 필드와 오래된 dashboard latest 상태 타입을 정리했다.
- 기본 게시판·갤러리 공통 보기 화면에 권한 기반 게시글 이동 UI를 연결하고 게시판별 관리자 판정을 목록·보기·쓰기 화면에 일관되게 적용했다.
- 게시글 이동과 API contract·인증 회귀 보강을 NUBO `283beae`·GOAPI `667bd00` 기반 v1.2.11 통합 릴리스로 게시했다.
- npm 10에서도 깨끗한 설치가 가능하도록 누락된 선택적 의존성을 lockfile에 반영해 자동 릴리스 경로를 복구했다.
- v1.2.11을 운영 서버에 update하고 기본 게시판·갤러리의 게시글 이동이 정상 동작하는 것을 확인했다.

## Open findings

- v1.2.15 릴리스 workflow run `32380738928`을 시작했다. 장시간 실행은 실시간 모니터링하지 않고 다음 작업 시작 시 최종 결과와 Release 생성을 확인한다.
- v1.2.14 릴리스 workflow run `32279749883`은 모든 build·검증·fresh-install gate를 통과했지만 checkout 없는 publish job의 `gh release create`가 로컬 Git 저장소를 요구해 마지막 게시 단계만 실패했다.
- 릴리스 CI는 GOAPI 공식 검증과 통합 자산 빌드에서 공식 빌드를 반복해 실행 시간이 길다. 현재 차단 문제는 아니므로 최적화는 보류한다.
- GitHub Actions의 v4 JavaScript action에 Node 20 사용 중단 안내가 표시된다. 현재 실행을 막지 않으므로 action major 갱신은 별도 호환성 확인 전까지 보류한다.
- Certbot 설치·약관·인증서 발급과 HTTPS redirect는 운영자가 수행한다.
- 내부 `nuboctl update --release`는 데이터 백업·복원을 수행하지 않으며 공개 `nuboctl update`도 외부 백업 확인을 유지한다.
- 전체 NUBO ESLint에는 기본값을 추가하면 런타임 의미가 달라질 수 있는 optional prop 경고 46건과 검토가 필요한 `v-html` 경고 4건이 남아 있다.
- 바이너리 제거 전 clone은 재작성된 원격 이력과 섞지 말고 새로 clone해야 한다.
- GitHub hosted Ubuntu 22 러너의 Vite 8 클라이언트 변환이 진행되지 않아 v1.2.2는 같은 태그·스크립트를 사용한 로컬 Node 22 깨끗한 clone에서 검증·게시했다.
- adoption dry-run은 포트 점유를 안내하고, 실제 실행은 기존 프로세스를 임의 종료하지 않은 채 점유 포트가 있으면 변경 전에 중단한다.
- v1.2.7까지 adoption한 서버는 대표 `nubo.service`를 원할 때 문서의 수동 절차로 추가한다.
- 사이트 전용 스킨은 기본 스킨을 직접 수정하지 않고 별도 key로 복사해야 이후 `git pull` 충돌을 줄일 수 있다.
- 공식 update 직후에는 공식 Web이 실행되며, 사이트 전용 스킨의 자동 재빌드는 아직 하지 않으므로 운영자가 `nuboctl customize`를 다시 실행해야 한다.
- Vite 8/Rolldown의 저사양 CPU 교착이 해결되면 임시 `rolldown-vite@7.3.1` override를 제거하고 Vite 8로 복귀해야 한다.
- API contract v1의 application 오류는 대부분 HTTP 200 + `success=false`이며, 표준 HTTP status 전환은 v2 호환 작업으로 남아 있다.

## Verification

- v1.2.15 후보: publish workflow YAML, release version 일치, NUBO 28개 테스트, ESLint 오류 0건·기존 경고 50건 상한, typecheck와 diff whitespace 검사를 통과했다.
- v1.2.14 후보: 로컬 NUBO 28개 테스트, ESLint 오류 0건·기존 경고 50건 상한, shell/YAML/version/diff 검사를 통과했다. GitHub Actions run `32279749883`에서 NUBO test/lint/typecheck/build, API contract, GOAPI 공식 환경 검증과 Ubuntu 22.04/24.04 fresh-install을 통과했다. publish는 제품 검증과 무관한 저장소 문맥 누락으로 실패했다.
- v1.2.12 후보: build-release 전체는 통과했지만 Ubuntu 22/24 fresh-install이 모두 32분간 무출력으로 실행되어 취소했으며 공개 Release는 만들지 않았다. 명령별 timeout과 진행 로그를 v1.2.13에 추가한다.
- v1.2.13 후보: build-release는 통과했고 fresh-install 정지 위치를 확인했다. Ubuntu 24의 불필요한 apt metadata 갱신은 5분 timeout, Ubuntu 22의 사전 설치 MySQL은 root 인증 차이로 실패해 공개 Release는 만들지 않았다. 사전 설치 패키지 재사용과 MySQL 인증 감지를 v1.2.14에 추가한다.
- lint 정리: 전체 ESLint 오류 0건·경고 50건 상한, NUBO 28개 테스트, typecheck, production build와 diff whitespace 검사를 통과했다.
- fresh-install smoke: 현재 v1.2.11 후보를 Node.js 22.23.2와 격리된 Ubuntu 22.04/24.04 systemd 환경에 각각 설치해 MariaDB bootstrap, GOAPI·Web 기동, `/ready`와 build/contract를 포함한 `/version` 검증을 통과했다.
- S2-Q04 필수 게이트: NUBO 28개 테스트·typecheck·production build·prebuilt smoke, contract 일치/불일치 회귀, workflow YAML parse와 공식 Ubuntu 22/libvips Docker 환경의 GOAPI 전체 test/vet을 통과했다. GOAPI 호스트 test/vet도 통과했다(`fc430b8`).
- S0-Q04: 일치·불일치·GOAPI 미준비 unit 경계, 관리자 경고 선별, 변경 파일 ESLint, NUBO 26개 테스트, typecheck, production build와 prebuilt `/version` smoke를 통과했다.
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
- 새 clone adoption·커스텀 스킨 경계 안내 변경은 관련 Vue ESLint, NUBO 15개 테스트, typecheck와 production build를 통과했다.
- v1.2.9 로컬 스킨 후보: 파생 manifest/checksum, 공식 기반 일치, Web-only 전환, dry-run, readiness 실패 복구와 nuboctl PATH 링크의 Go/Node 단위 회귀 테스트를 통과했다.
- v1.2.9 전달: 고정 GOAPI 커밋과 clean NUBO `7967275`로 통합 asset을 빌드해 nuboctl 0.9.6, 두 libvips 변형, 내부·외부 checksum, Ubuntu 24 재해제와 prebuilt smoke를 통과했다. GitHub 게시본도 다시 내려받아 SHA-256과 manifest를 확인했다.
- Rolldown-Vite 호환 핀: Node 26.7.0의 깨끗한 `npm ci`, 17개 테스트, typecheck, audit 0건과 prebuilt smoke를 통과했다. CPU 2개 제한 production build는 4,839개 모듈을 변환해 23초에 완료했고 최대 RSS는 약 2.67GiB였다.
- 사이트 빌드 복사: Nitro 형태의 내부 상대 링크를 파생 디렉터리에 복사한 뒤 링크 문자열 보존과 `hashTree` 통과를 회귀 테스트로 확인했다.
- CLI 통합·출력: 공개 update/customize source routing, 잘못된 작업 폴더 안내, 내부 `--release` 분기와 캡처 출력의 무색상 보존을 Go 회귀 테스트로 확인했다.
- CLI 도움말·업로드 진단: 공개 명령별 도움말 완전성과 인자 없는 성공 출력을 검사하고, systemd `User=` 자동 감지와 명시적 `--user` 우선 적용을 테스트했다.
- v1.2.10 전달: clean NUBO `4ad1595`와 고정 GOAPI `c7e2cf9`로 nuboctl 0.10.0·두 libvips 변형·Nuxt prebuilt를 묶어 Ubuntu 검증과 내부·외부 SHA-256을 통과했다. 게시 asset을 다시 내려받아 manifest를 확인하고 새 shallow clone의 원격 `server:prepare`도 통과했다.
- systemd lifecycle 수정: fresh install과 기존 drop-in 없는 update의 추가, 기존 다른 drop-in 충돌 보호를 회귀 테스트로 확인했다. systemd 259 사용자 manager에서 대표 unit restart 전후 GOAPI·Web 시험 프로세스 PID가 모두 바뀌는 것도 검증했다.
- v1.2.10을 Cafe24 가상서버 호스팅에서 설치·update하고 실제 MySQL/MariaDB, Nginx/TLS, 기본 이미지 처리와 운영 명령을 확인해 현재 실서버 QA를 완료했다.
- GOAPI 인증 경계: repository·service·HTTP middleware/handler의 선별 테스트와 `go test ./...`, `go test -race ./...`, `go vet ./...`를 통과했다(GOAPI `4b80741`).
- API contract v1: Nitro/GOAPI route 대조에서 누락·초과 0건을 확인했고, request/result 타입 대조 뒤 변경 파일 ESLint, NUBO 18개 테스트, typecheck와 production build를 통과했다.
- 게시글 이동: 목적지 목록 권한 필터와 양쪽 관리자 권한을 GOAPI 회귀 테스트로 확인했고, 전체 Go 테스트·vet와 NUBO 18개 테스트·변경 파일 ESLint·typecheck·production build를 통과했다.
- v1.2.11 전달: Ubuntu 22/24, qemu64 이미지 처리, 두 libvips 변형, 내부·외부 checksum, prebuilt health·readiness·SSR·proxy smoke를 통과한 asset과 SHA-256을 게시했다.
- v1.2.11 운영 QA: `nuboctl update` 후 게시글 이동 UI, 목적지 선택, 이동 처리와 새 게시판 주소 진입이 정상임을 확인했다.

## Next action

- 다음 작업 시작 시 GitHub Actions run `32380738928`의 최종 결과와 v1.2.15 Release 생성을 확인한다.
- 성공하면 게시 asset의 SHA-256·manifest 버전을 확인하고 상태 문서를 released로 갱신한다. 실패하면 태그를 이동하지 말고 실패 단계만 고쳐 다음 patch 버전으로 재시도한다.
- 릴리스가 끝난 뒤 다음 필수 후보는 S1-Q01 request ID/구조화 로그와 S1-Q02 오류 분류다. 둘 다 크기 `M`이므로 구현 전에 요청 추적의 최소 범위와 운영자에게 꼭 필요한 오류 안내만 다시 합의한다.
- optional prop·`v-html` lint 경고 50건, 릴리스 CI 중복 빌드 최적화와 action major 갱신은 현재 보류한다.
