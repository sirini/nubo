# NUBO release runner

NUBO의 `build-release`는 기본적으로 GitHub-hosted `ubuntu-22.04`에서 실행한다. 생성한 CLI/runtime
artifact는 별도의 일회용 Ubuntu 22.04·24.04 job에 전달해 bootstrap, checksum, 원자적 배치와 libvips
동적 링크를 검증한다. 태그 push일 때만 모든 검증 뒤 GitHub Release를 게시한다.

현재 저장소 변수는 다음 값이다.

```json
NUBO_RELEASE_BUILD_RUNNER=["ubuntu-22.04"]
```

변수가 없을 때도 workflow의 기본값은 같은 hosted runner다. 개발 PC가 꺼져 있어도 릴리스가 대기열에서
멈추지 않는 것이 기본 운영 계약이다.

## 게시 없는 릴리스 검증

새 버전을 태그하기 전에는 전체 asset과 Ubuntu smoke를 만들되 Release를 게시하지 않는 수동 검증을
실행한다. 입력 태그는 checkout의 `env.sample` 버전과 일치해야 한다.

```bash
gh workflow run publish-release.yml \
  --repo sirini/nubo \
  --ref main \
  -f release_tag=v1.3.1
gh run watch --repo sirini/nubo --exit-status
```

정식 태그 push에서는 같은 게이트를 다시 실행하고 모든 smoke가 통과한 경우에만 게시한다.

## 선택적 self-hosted 가속

WSL2 runner가 online이고 Docker/npm cache를 재사용하려는 경우에만 저장소 변수를 다음 JSON 배열로
바꾼다.

```bash
gh variable set NUBO_RELEASE_BUILD_RUNNER \
  --repo sirini/nubo \
  --body '["self-hosted","Linux","X64","nubo-release"]'
gh workflow run verify-release-runner.yml --repo sirini/nubo
gh run watch --repo sirini/nubo --exit-status
```

runner는 WSL2 사용자 서비스다.

```bash
systemctl --user status nubo-actions-runner
systemctl --user restart nubo-actions-runner
```

WSL을 종료하거나 다른 작업 환경으로 옮기기 전에는 hosted 설정으로 되돌린다. `runs-on`은 job이 대기열에
들어갈 때 결정되므로 이미 queued인 run에는 변수 변경이 적용되지 않는다.

```bash
gh variable set NUBO_RELEASE_BUILD_RUNNER \
  --repo sirini/nubo \
  --body '["ubuntu-22.04"]'
```

공개 저장소의 self-hosted runner는 신뢰하지 않는 fork 코드에 노출하지 않는다. `nubo-release` 라벨은
태그 릴리스, 운영자가 직접 실행한 `workflow_dispatch`와 runner 검증에만 사용한다.
