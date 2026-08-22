# NUBO release runner

NUBO의 태그 릴리스는 무거운 `build-release` job만 신뢰하는 로컬 Linux x64 runner에서 실행하고,
Ubuntu 22.04/24.04 fresh-install과 최종 GitHub Release 게시는 일회용 GitHub hosted runner에서
실행한다. 로컬 runner의 Docker layer와 npm download cache를 재사용하면서도 실제 설치 호환성 검증은
깨끗한 환경에 남기는 경계다.

로컬 runner에서는 `~/.npm`이 실행 사이에 그대로 유지되므로 `setup-node`의 원격 cache upload를
사용하지 않는다. 수 GiB의 로컬 캐시를 매번 압축·업로드하는 비용을 피하기 위한 것이며, hosted
fallback에서는 기존 GitHub npm cache를 계속 사용한다.

기본 `build-release` 라벨은 다음과 같다.

```json
["self-hosted", "Linux", "X64", "nubo-release"]
```

저장소 변수 `NUBO_RELEASE_BUILD_RUNNER`가 있으면 그 JSON 배열을 대신 사용한다. 현재 로컬 구성을
명시하려면 다음과 같이 설정한다.

```bash
gh variable set NUBO_RELEASE_BUILD_RUNNER \
  --repo sirini/nubo \
  --body '["self-hosted","Linux","X64","nubo-release"]'
```

runner를 점검한 뒤 수동 smoke workflow로 checkout과 Docker 실행을 확인한다.

```bash
gh workflow run verify-release-runner.yml --repo sirini/nubo
gh run watch --repo sirini/nubo
```

새 버전을 태그하기 전에는 게시 workflow를 수동 검증 모드로 실행할 수 있다. 이 모드는 로컬에서 전체
통합 asset을 만들고 hosted Ubuntu 22.04/24.04 fresh-install까지 수행하지만 GitHub Release는 게시하지
않는다. 입력 태그는 checkout의 `env.sample` 버전과 일치해야 한다.

```bash
gh workflow run publish-release.yml \
  --repo sirini/nubo \
  --ref main \
  -f release_tag=v1.2.17
```

정식 태그 push에서는 같은 게이트를 다시 실행하고 fresh-install이 모두 통과한 경우에만 게시한다.

## Hosted fallback

로컬 PC를 사용할 수 없을 때는 변수를 hosted runner로 바꾸고 대기 중인 run을 취소한 뒤 다시 실행한다.
`runs-on`은 job이 대기열에 들어갈 때 결정되므로 이미 대기 중인 run에는 변수 변경이 적용되지 않는다.

```bash
gh variable set NUBO_RELEASE_BUILD_RUNNER \
  --repo sirini/nubo \
  --body '["ubuntu-22.04"]'
```

로컬 runner로 돌아올 때는 위의 기본 JSON 배열을 다시 설정한다. fallback에서도 이후 fresh-install과
publish job 구조는 바뀌지 않는다.

## Local service boundary

runner는 WSL2 사용자 서비스로 실행하며 상태는 다음 명령으로 확인한다.

```bash
systemctl --user status nubo-actions-runner
systemctl --user restart nubo-actions-runner
```

사용자 linger가 꺼진 WSL2에서는 WSL 사용자 세션이 실행 중이어야 한다. PC나 WSL이 꺼져 있으면 태그
workflow의 build job은 runner가 다시 online이 될 때까지 대기하며, hosted fallback이 필요하면 위 변수를
전환한다.

이 저장소는 공개 저장소이고 self-hosted runner는 호스트와 Docker에 접근할 수 있다. 따라서
`pull_request`처럼 신뢰하지 않는 fork 코드를 실행하는 workflow에는 `nubo-release` 라벨을 사용하지
않는다. 태그 릴리스와 운영자가 직접 실행하는 runner smoke에만 사용한다.
