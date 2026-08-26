# nuboctl과 nubo-market

NUBO v1.3.0은 서버 운영과 스킨 소스 관리를 두 명령으로 분리한다.

| 명령 | 책임 | 하지 않는 일 |
| --- | --- | --- |
| `nuboctl` | 상태·설정 진단, 준비된 릴리스 적용 | 소스 갱신, 다운로드, Nuxt 빌드 |
| `nubo-market` | 스킨 검색·설치·변경 확인·안전한 교체 | 빌드, Git 변경, 프로세스 재시작 |

기존 `nuboctl update`, `customize`, `market`, `skin`과 `releases`는 v1.2 설치·자동화 호환을 위해 남긴다.
새 운영 안내는 `status`, `doctor`, `apply`와 독립 `nubo-market`을 기준으로 한다.

## nuboctl

```bash
nuboctl status
nuboctl doctor
nuboctl help apply
```

`status`와 `doctor`는 서버를 바꾸지 않는다. `status`는 실행 상태를 빠르게 보고, `doctor`는 manifest,
checksum, 환경 파일, 업로드, systemd와 Node.js를 더 자세히 검사한다.

### apply

먼저 소스 checkout에서 공식 asset을 검증·배치한다.

```bash
npm run server:stage
```

제한망에서는 archive와 `.sha256` 파일을 함께 반입한다.

```bash
npm run server:stage -- \
  --archive "$PWD/nubo-1.3.0-linux-amd64.tar.gz" \
  --checksum "$PWD/nubo-1.3.0-linux-amd64.tar.gz.sha256"
```

staging은 서비스를 바꾸지 않고 정확한 후보 경로를 출력한다. 그 후보의 nuboctl을 사용해 dry-run 뒤
적용한다.

```bash
sudo /opt/nubo/releases/nubo-1.3.0-linux-amd64/nuboctl \
  apply /opt/nubo/releases/nubo-1.3.0-linux-amd64 --dry-run
sudo /opt/nubo/releases/nubo-1.3.0-linux-amd64/nuboctl \
  apply /opt/nubo/releases/nubo-1.3.0-linux-amd64
```

`apply`의 경계는 다음과 같다.

- 후보 경로는 필수이며 자동 탐색하지 않는다.
- manifest, 모든 checksum, OS·CPU, 내장 libvips와 서비스 설정을 먼저 검사한다.
- GOAPI 출처가 바뀔 때만 백업 확인과 additive DB migration을 수행한다.
- `current` 링크를 원자적으로 전환하고 서비스를 재시작한 뒤 readiness를 확인한다.
- 실패하면 이전 릴리스와 런타임 환경을 복구한다. 이미 끝난 DB migration은 되돌리지 않는다.
- 동시에 두 apply/update를 실행하지 못하도록 설치별 잠금을 사용한다.

비대화형으로 GOAPI 변경을 적용할 때만, 운영자가 외부 백업 완료를 실제로 확인한 뒤
`--non-interactive --backup-confirmed`를 전달한다.

## nubo-market

Source Mode에서는 `npm run server:prepare`가 `./nubo-market` 링크를 만든다. 공식 설치는
`/usr/local/bin/nubo-market`을 등록한다.

```bash
nubo-market search gallery
nubo-market info nubo-awesome-gallery
nubo-market install nubo-awesome-gallery
```

설치 시 Registry 메타데이터, NUBO 최소 버전, archive SHA-256, 압축 경로와 `skin.json`의 key·version을
검사한다. 기존 폴더를 덮어쓰지 않고 `.nubo-market.json` 영수증에 설치 파일별 SHA-256을 기록한다.
패키지 내부 링크와 특수 파일, 경로 이탈, 영수증 파일 위조는 거부한다.

설치 뒤에는 운영자가 명시적으로 빌드·재시작한다.

```bash
npm run build
node --env-file="$PWD/.env" .output/server/index.mjs
```

PM2나 tmux를 사용하면 기존 관리 방식에 맞게 Node 프로세스를 다시 시작한다. Market은 어떤 프로세스
관리자도 감지하거나 실행하지 않는다.

### diff와 update

```bash
nubo-market diff nubo-awesome-gallery
nubo-market update nubo-awesome-gallery --dry-run
nubo-market update nubo-awesome-gallery
```

`diff`는 영수증과 현재 파일을 비교해 수정·추가·누락·링크를 표시한다. `update`는 다음 조건을 모두
만족할 때만 새 패키지로 교체한다.

1. 기존 영수증이 정상이다.
2. 현재 파일이 영수증과 완전히 같다.
3. 새 패키지의 checksum·manifest·NUBO 호환성이 정상이다.
4. 실제 전환 직전 다시 검사해 다운로드 중 변경이 없었다.

새 폴더를 같은 파일시스템에서 준비한 뒤 원자적으로 교체하며 `--force`, downgrade와 자동 병합은 없다.
dry-run도 새 패키지를 다운로드·검증하지만 현재 폴더는 바꾸지 않는다.

### fork

Market 설치본을 수정했다면 별도 사이트 스킨으로 분리한다.

```bash
nubo-market fork nubo-awesome-gallery my-gallery
```

현재 수정·추가 파일을 새 key로 복사하고 `skin.json`에 원본 key·version을 `derived_from`으로 기록한다.
Market 영수증은 복사하지 않으므로 이후 update와 버전 관리는 운영자 책임이다. 링크와 특수 파일은
fork에도 포함하지 않는다.

### remove

```bash
nubo-market remove nubo-awesome-gallery --dry-run
nubo-market remove nubo-awesome-gallery
```

영수증과 현재 파일이 완전히 일치할 때만 삭제한다. 수정본에는 fork를 사용한다.

## 신뢰 경계

checksum은 패키지 무결성만 증명한다. Vue 스킨은 NUBO와 같은 브라우저 권한으로 실행되므로 제작자와
소스 검토가 별도로 필요하다. Market 설치는 패키지 자체의 npm script나 의존성을 실행하지 않으며,
NUBO의 고정된 lockfile과 전체 빌드만 사용한다.

## 초기 설치와 adoption

초기 설치에는 아직 관리 명령 링크가 없으므로 다음 wrapper를 사용한다.

```bash
npm run server:install
```

v1.2.0 이전 소스·PM2 설치는 외부 DB·업로드 백업과 기존 프로세스 종료를 확인한 뒤 전환한다.

```bash
npm run server:adopt -- --dry-run
npm run server:adopt
```

Nginx와 TLS는 모든 경로에서 운영자 소유이며 NUBO 도구가 생성·수정·reload하지 않는다.
