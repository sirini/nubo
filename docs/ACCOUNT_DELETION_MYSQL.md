# 계정 삭제 MySQL 1093 수정 (2026-09-12)

## 증상과 원인

SENSTA 1.0 (2)의 실기기 심사 영상 촬영 중 계정 삭제가 실패했다. 운영 Nginx 로그에 22:39:28과
22:39:38 KST `DELETE /goapi/auth/account`가 기록됐다. 응답은 HTTP 200이지만 GOAPI의 기존 계약은
본문 `success`로 성공 여부를 구분한다. 두 응답 크기는 각각 141 bytes였다.

운영 MySQL `8.0.46-0ubuntu0.22.04.3`에서 다음 **EXPLAIN만** 실행해 오류 1093을 확인했다.
운영 데이터 삭제나 변경은 실행하지 않았다.

```sql
EXPLAIN DELETE FROM sen_comment
WHERE uid IN (
  SELECT uid FROM sen_comment
  WHERE user_uid = 0 OR post_uid IN (SELECT uid FROM sen_post WHERE user_uid = 0)
);
```

오류는 삭제 대상 `comment`를 서브쿼리에서 다시 읽는 데서 발생한다. 같은 오류를 GOAPI 응답으로
직렬화하면 운영 로그와 동일한 141 bytes다. 서버가 응답 본문 자체를 기록하지 않아 해당 요청의
본문은 직접 확보하지 않았지만, 운영 SQL과 로컬 MySQL 재현으로 결함을 확인했다.
게시물·댓글이 없는 신규 계정에서도 실패하며 전체 트랜잭션이 rollback된다.

GOAPI `ed55c9b`의 `internal/repositories/user_repo.go`에서 조건을 직접 적용하도록 바꿨다.

```sql
DELETE FROM <prefix>comment
WHERE user_uid = ? OR post_uid IN (SELECT uid FROM <prefix>post WHERE user_uid = ?);
```

본인 댓글 및 본인 게시글에 달린 댓글의 기존 삭제 범위, 인증·명시적 DELETE 확인, Apple 승인 폐기,
실패 시 rollback과 commit 후 파일 정리를 유지한다. API 요청·응답과 DB schema 변경은 없다.
운영에서도 수정 SQL의 EXPLAIN은 정상 처리됐다.

## 회귀 검증

GOAPI `internal/repositories/user_delete_integration_test.go`는 실제 MySQL과 InnoDB 외래 키를 사용한다.
테스트 전용 `goapi_account_delete_test` DB만 허용하고 매번 별도 접두사의 테이블을 만든 뒤 정리한다.

- 빈 계정 삭제: 관계없는 게시물·댓글을 보존하고 계정 인증·개인정보를 지우고 비활성화한다.
- 콘텐츠가 있는 계정: 타인 게시글에 쓴 댓글, 본인 게시글에 달린 타인 댓글, 관련 좋아요·파일·알림·
  대화·신고·차단·메일·토큰을 정리하며 다른 사용자 자료는 유지한다.
- 마지막 사용자 익명화에서 강제 실패: 앞서 삭제한 모든 테이블의 행 수가 복원되고 파일 삭제 대상은
  반환하지 않는다.

수정 전 소스를 Go overlay로 주입하면 세 시나리오 모두 실제 MySQL 1093으로 실패했다. 수정 후
통합 테스트를 포함한 `go test ./...`와 `go vet ./...`는 통과했다. 호스트의 오래된 Command Line Tools
링커와 macOS 27 SDK 불일치를 피하기 위해 Xcode 27 RC의 `DEVELOPER_DIR`를 사용했다.

```bash
docker run --detach --name goapi-account-delete-mysql \
  --publish 127.0.0.1:13367:3306 \
  --env MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  --env MYSQL_DATABASE=goapi_account_delete_test mysql:8.0

DEVELOPER_DIR=/Applications/Xcode-27-RC.app/Contents/Developer \
NUBO_ACCOUNT_DELETE_TEST_DSN='root@tcp(127.0.0.1:13367)/goapi_account_delete_test' \
go test ./...
```

## 운영 반영과 촬영

공식 `goapi.git/scripts/build-ubuntu22.sh`로 교체용 Linux amd64 runtime을 준비했고 Ubuntu 22.04·24.04,
qemu64/max 실행 검증을 통과했다. migration과 환경 변수 변경은 필요 없다.

- 교체 파일: `/Users/sirini/github/goapi.git/dist/nubo-runtime/bin/goapi`
- SHA-256: `7a1a5afa2761df173efe510b72eb8e6525e2dee13d1be1d76eec0e60fd386044`
- 교체 대상: `/var/www/sensta.me/bin/goapi`
- 교체 전 확인한 운영 SHA-256: `8b400bc609fd60185d2b1bf919cd9f3848f66ddcb07f4cdd017326de971643f1`
- 기존 운영의 libvips와 호환되는 동일한 공식 runtime 라이브러리 조합이다.

재촬영 영상 검토 시 운영 `/var/www/sensta.me/bin/goapi`의 SHA-256이 위 수정판과 일치함을
읽기 전용으로 확인했다. Nginx에는 2026-09-12 23:11:12 KST `DELETE /goapi/auth/account`,
`SENSTA/2`, HTTP 200, 응답 50 bytes가 기록됐다. HTTP 상태만으로 성공을 판단하지 않고,
22:57:27에 시작한 새 영상의 **13:46–13:48 계정 삭제 완료** 및 13:50 로그인 화면 복귀와 대조했다.
이번 검토에서 Codex가 운영 runtime을 교체하거나 계정을 대신 삭제하지 않았다.

서버 수정이므로 SENSTA iOS 제출 빌드 `1.0 (2)`를 새로 만들 필요는 없다. 이메일로 새로 가입한 촬영용
계정의 삭제 성공을 확인했다. 이 영상은 Apple 연결 계정의 승인 폐기나 삭제 후 재실행을 검증한 자료는
아니다. 상세 검토·타임스탬프는 sibling iOS의 `docs/APP_REVIEW_RESPONSE_2026-09-12.md`에 기록했고,
제출용 영상 준비와 Apple 회신·재제출은 남았다.

참고: [MySQL의 서브쿼리 오류 1093 설명](https://dev.mysql.com/doc/refman/8.0/en/subquery-errors.html).
