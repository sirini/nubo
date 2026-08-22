package main

import (
	"fmt"
	"os"
)

type helpPage struct {
	title string
	body  string
}

var helpPages = map[string]helpPage{
	"": {
		title: "NUBO 서버 관리",
		body: `사용법: nuboctl <명령> [옵션]

처음에는 이 여섯 가지만 기억하면 됩니다.
  status          지금 사이트가 잘 실행되는지 확인
  doctor          설치와 설정에서 문제 찾기
  update          새 공식 버전으로 업데이트
  customize       수정한 스킨을 빌드하고 적용
  skin            NUBO Market 스킨 검색·정보·설치
  activate-nginx  사이트를 HTTP로 공개

명령별 도움말:
  nuboctl help <명령>
  nuboctl <명령> --help

예: nuboctl help customize`,
	},
	"status": {
		title: "현재 상태 확인",
		body: `서비스, 환경 설정, 업로드 폴더와 웹 응답을 빠르게 확인합니다.
서버를 변경하지 않으므로 언제든 실행해도 됩니다.

사용법:
  nuboctl status`,
	},
	"doctor": {
		title: "설치 문제 점검",
		body: `운영체제, Node.js, 공식 파일, 환경 설정, 업로드 폴더와 Nginx를 자세히 점검합니다.
서버를 변경하지 않습니다. 문제가 있을 때 status 다음으로 실행하세요.

사용법:
  nuboctl doctor`,
	},
	"update": {
		title: "NUBO 업데이트",
		body: `NUBO 프로젝트를 fast-forward로 갱신하고 새 공식 버전을 안전하게 전환합니다.
커스텀 스킨을 사용 중이면 새 버전용 Web을 먼저 빌드하고 update 뒤 자동 적용합니다.
GOAPI 출처가 바뀌어 DB 준비가 필요할 때만 외부 백업을 확인합니다.

사용법:
  nuboctl update --dry-run   바꿀 내용을 먼저 확인
  nuboctl update             소스 갱신·업데이트·커스텀 Web 적용
  nuboctl update --no-pull   현재 checkout 그대로 사용
  nuboctl update --no-customize  이번에만 커스텀 Web 적용 생략`,
	},
	"customize": {
		title: "사이트 꾸미기 적용",
		body: `app/skins에서 수정한 화면을 검사하고 빌드한 뒤 Web만 안전하게 전환합니다.
NUBO 프로젝트 폴더에서 실행합니다. 실패하면 이전 Web으로 자동 복구합니다.

사용법:
  nuboctl customize --dry-run   빌드하되 실행 중인 사이트는 유지
  nuboctl customize             빌드·검증·적용`,
	},
	"activate-nginx": {
		title: "웹 공개 설정",
		body: `설치기가 준비한 Nginx 설정을 연결하고 검사한 뒤 HTTP 사이트를 공개합니다.
HTTPS 인증서 발급은 포함하지 않으며 출력되는 다음 명령을 따릅니다.

사용법:
  nuboctl activate-nginx --dry-run
  nuboctl activate-nginx`,
	},
	"install": {
		title: "NUBO 처음 설치",
		body: `처음에는 nuboctl이 아직 설치되지 않았으므로 NUBO 프로젝트 폴더에서 npm bootstrap을 사용합니다.

사용법:
  npm run server:install`,
	},
	"adopt": {
		title: "기존 NUBO 사이트 전환",
		body: `v1.2.0 이전 설치를 새 prebuilt·systemd 운영 방식으로 한 번만 전환합니다.
새로 clone한 NUBO 프로젝트에서 기존 .env와 upload를 준비한 뒤 실행합니다.

사용법:
  npm run server:adopt -- --dry-run
  npm run server:adopt`,
	},
	"skin": {
		title: "NUBO Market 스킨",
		body: `NUBO Market에서 스킨을 찾고 현재 소스 checkout의 app/skins에 안전하게 설치합니다.
checksum과 패키지 경로를 검증하며 기존 스킨을 덮어쓰지 않습니다. 설치 뒤 customize로 빌드·적용합니다.

사용법:
  nuboctl skin search [검색어]
  nuboctl skin info <스킨-key>
  nuboctl skin install <스킨-key>
  nuboctl skin install <스킨-key> --version 1.0.0
  nuboctl customize

다른 Registry를 시험할 때는 --registry URL 또는 NUBO_MARKET_URL을 사용합니다.
skin apply는 customize가 준비한 파생 릴리스를 전환하는 내부 명령입니다.`,
	},
	"version": {
		title: "nuboctl 버전 확인",
		body: `사용법:
  nuboctl version`,
	},
}

func printHelp(topic string) bool {
	page, ok := helpPages[topic]
	if !ok {
		return false
	}
	fmt.Fprintln(os.Stdout, paint(os.Stdout, ansiBoldCyan, page.title))
	fmt.Fprintln(os.Stdout)
	fmt.Fprintln(os.Stdout, page.body)
	return true
}
