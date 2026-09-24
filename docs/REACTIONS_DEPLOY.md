# 다중 리액션 운영 검증

대상: NUBO `main`의 다중 리액션 웹, GOAPI `74123ec` 이상(확장 여섯 종류 포함; `80be83f`는 기존 네 종류만). Ubuntu 22.04 amd64 소스 설치 기준.

## 빌드와 반입

1. GOAPI checkout이 검증된 커밋인지 확인한다. 공식 Linux 실행 파일은 GOAPI의 `./scripts/build-ubuntu22.sh`로만 만든다. 이 스크립트는 Docker buildx가 필요하다. 2026-09-24 현재 리뷰에 사용한 Intel Mac에는 `docker`/buildx가 없어 공식 실행 파일을 아직 만들지 못했다.
2. Docker buildx가 준비된 빌드 환경에서 다음을 실행한다.

   ```bash
   cd ~/github/goapi.git
   git rev-parse --short HEAD
   docker buildx version
   ./scripts/build-ubuntu22.sh
   file dist/nubo-runtime/bin/goapi
   ```

   `dist/nubo-runtime/bin/goapi`, `lib/`, `licenses/sharp-libvips/`를 **한 묶음**으로 Ubuntu 서버의 별도 임시 디렉터리에 전송한다. 예를 들어 빌드 호스트에서 `rsync -a dist/nubo-runtime/ USER@HOST:~/nubo-reaction-runtime/`을 사용한다. 실행 중인 파일을 전송 도중 덮어쓰지 않는다.

3. `deploy/release-sources.json`은 기존 v1.3.2 릴리스의 GOAPI `367e8fb`을 고정한다. 이번 개발 커밋을 배포할 때 `./bin/nubo download`를 실행하면 새 GOAPI가 설치되지 않는다. 새 공식 릴리스 자산과 checksum이 게시되기 전에는 위에서 직접 빌드한 묶음을 사용한다.

## 서버 적용

1. 서버에서 `uname -m`이 `x86_64`인지 확인한다. 현재 NUBO 소스와 `.env`의 로컬 수정 사항을 확인하고, **DB·업로드·`.env`·현 GOAPI `bin/lib/licenses`·웹 `.output`을 서버 외부에 백업**한다. DB 이름과 접두사는 `.env`의 `DB_NAME`, `DB_TABLE_PREFIX`를 사용한다. 리액션 쓰기와 웹·GOAPI 프로세스를 멈춘다.
2. 백업한 배포 방식에 맞춰 NUBO `main`을 갱신하고 `npm ci`, `npm run build`를 실행한다. 반입한 GOAPI `bin/goapi`, `lib/`, `licenses/sharp-libvips/`를 함께 현재 NUBO 디렉터리에 교체한다. 소스 설치에서 디렉터리 소유자가 직접 배포한다면 예시는 다음과 같다.

   ```bash
   mkdir -p bin lib licenses/sharp-libvips
   install -m 0755 "$HOME/nubo-reaction-runtime/bin/goapi" bin/goapi
   cp -a "$HOME/nubo-reaction-runtime/lib/." lib/
   cp -a "$HOME/nubo-reaction-runtime/licenses/sharp-libvips/." licenses/sharp-libvips/
   ```
3. **신 GOAPI 실행 파일로**, NUBO 작업 디렉터리에서 다음을 실행한다. `install`은 리액션 테이블만이 아니라 전체 설치·이행 경로를 실행하며, 이미 적용한 이행은 재실행 가능하게 설계되어 있다.

   ```bash
   NUBO_ENV_FILE="$PWD/.env" ./bin/goapi install
   ```

4. 접두사를 실제 값으로 치환해 DB에서 아래를 확인한다. 두 불변식 결과는 모두 `0`이어야 한다. `post_like`와 `comment_like`의 `reaction_type` 컬럼 및 `(대상 uid, user_uid)` 고유 키도 확인한다.

   ```sql
   SHOW COLUMNS FROM <prefix>post_like LIKE 'reaction_type';
   SHOW COLUMNS FROM <prefix>comment_like LIKE 'reaction_type';
   SHOW INDEX FROM <prefix>post_like WHERE Key_name = 'uq_post_like_post_user';
   SHOW INDEX FROM <prefix>comment_like WHERE Key_name = 'uq_comment_like_comment_user';
   SELECT COUNT(*) FROM <prefix>post_like WHERE liked <> (reaction_type = 1);
   SELECT COUNT(*) FROM <prefix>comment_like WHERE liked <> (reaction_type = 1);
   ```

5. GOAPI를 먼저 시작하고 `curl -fsS http://127.0.0.1:3006/goapi/ready`로 DB 연결을 확인한다(`GOAPI_BASE=goapi` 기준). 웹을 production 설정으로 시작한 뒤 `curl -fsS http://127.0.0.1:3000/ready`를 확인한다. 실제 재시작 명령은 현재 서버의 systemd·PM2·tmux 운영 방식에 맞춘다.

## 브라우저와 앱에서 확인

- 일반·공지·블로그·갤러리 목록과 기본/고급 홈에서 댓글 수와 종류별 리액션 수가 보이는지 확인한다.
- 로그인 사용자 A로 게시글과 댓글에 열 종류(`좋아요 → 최고 → 아차 → 글쎄요 → 웃겨요 → 축하해요 → 멋져요 → 응원해요 → 슬퍼요 → 주목해요 → 취소`)를 적용하고 목록·상세 새로고침 값이 일치하는지 확인한다. 현재 종류를 다시 선택했을 때도 취소되어야 한다.
- 사용자 B로 같은 대상을 확인해 A의 선택과 독립적인지 확인한다. 비로그인 선택 시 로그인 화면을 거쳐 원래 화면으로 돌아오는지도 확인한다.
- 작은 화면의 고급 홈에서 리액션 선택기가 보이는지, 메뉴가 카드에 잘리지 않는지, 키보드·라이트/다크 테마에서 메뉴를 열고 닫을 수 있는지 확인한다.
- 기존 iOS/Android의 좋아요·취소가 다른 종류의 리액션을 지우지 않고 `like` 수만 바꾸는지 확인한다. 앱은 리액션 연동 전이라 네 종류 시절과 같은 구 좋아요 계약만 사용하며, 새 응답의 확장 필드는 앱이 무시한다.

문제가 생기면 쓰기를 다시 멈추고 백업한 실행 파일·웹 산출물로 복구한다. 구 GOAPI로 리액션 쓰기를 재개하면 새 `reaction_type`과 `liked`가 어긋날 수 있으므로 구·신 GOAPI를 함께 실행하지 않는다. DB까지 완전히 되돌려야 할 경우에는 백업 시점 이후 데이터 손실을 검토한 뒤 DB 백업을 복원한다.
