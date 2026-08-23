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

처음에는 이 일곱 가지만 기억하면 됩니다.
  status          지금 사이트가 잘 실행되는지 확인
  doctor          설치와 설정에서 문제 찾기
  update          새 공식 버전으로 업데이트
  customize       수정한 스킨을 빌드하고 적용
  market          NUBO Market 스킨 검색·정보·설치·삭제
  releases        설치된 릴리스 확인·안전한 정리
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
Node heap은 기본 1536 MiB이며 기존 NODE_OPTIONS의 사용자 지정값을 우선합니다.

사용법:
  nuboctl customize --dry-run   빌드하되 실행 중인 사이트는 유지
  nuboctl customize             빌드·검증·적용`,
	},
	"releases": {
		title: "릴리스 보관함 정리",
		body: `설치된 릴리스를 보여주고 현재·직전·공식 기반·최신 예비 릴리스를 제외한 이전 파일을 정리합니다.
삭제 후보도 manifest와 checksum이 모두 정상일 때만 지우며, 먼저 dry-run으로 정확한 대상을 확인하세요.

사용법:
  nuboctl releases list
  sudo nuboctl releases prune --dry-run
  sudo nuboctl releases prune

옵션:
  --keep N        보호 대상 외에 최신 예비 릴리스 N개 보존 (기본 1)
  --releases DIR  릴리스 보관 디렉터리
  --current PATH  현재 릴리스 링크
  --previous PATH 직전 릴리스 링크`,
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
	"market": {
		title: "NUBO Market 스킨",
		body: `NUBO Market에서 스킨을 찾고 현재 소스 checkout의 app/skins에 안전하게 설치·삭제합니다.
checksum과 패키지 경로를 검증하며 기존 스킨을 덮어쓰지 않습니다. 소스 변경 뒤 customize로 빌드·적용합니다.

사용법:
  nuboctl market help [search|info|install|remove]

명령별 옵션과 안전 경계는 위 도움말에서 확인할 수 있습니다.
기존 nuboctl skin search/info/install도 호환 별칭으로 유지됩니다.`,
	},
	"skin": {
		title: "스킨 호환 명령",
		body: `Market 명령의 이전 이름과 customize 내부 적용 명령을 호환성 때문에 유지합니다.

새로운 검색·설치에는 nuboctl market을 사용하세요.
skin apply는 customize가 준비한 파생 릴리스를 전환하는 내부 명령입니다.`,
	},
	"version": {
		title: "nuboctl 버전 확인",
		body: `사용법:
  nuboctl version`,
	},
}

var marketHelpPages = map[string]helpPage{
	"": {
		title: "NUBO Market 명령",
		body: `웹에서 둘러보기: https://nubohub.org/market/

사용법:
  nuboctl market search [검색어]       이름·key·설명으로 스킨 찾기
  nuboctl market info <스킨-key>      버전·제작자·호환성 확인
  nuboctl market install <스킨-key>   검증한 스킨을 현재 소스에 설치
  nuboctl market remove <스킨-key>    변경되지 않은 Market 스킨 삭제

명령별 도움말:
  nuboctl market help <명령>
  nuboctl market <명령> --help

설치와 삭제는 소스만 바꿉니다. 실행 중인 사이트에 반영하려면 nuboctl customize를 실행하세요.`,
	},
	"search": {
		title: "Market 스킨 찾기",
		body: `공개 Market의 스킨을 이름·key·설명으로 검색합니다. 검색어를 생략하면 전체 목록을 봅니다.

사용법:
  nuboctl market search
  nuboctl market search gallery

옵션:
  --registry URL   시험할 Registry URL`,
	},
	"info": {
		title: "Market 스킨 정보",
		body: `스킨의 최신 버전, 제작자, 요구 NUBO 버전, 기능과 설명을 확인합니다.

사용법:
  nuboctl market info nubo-awesome-gallery

옵션:
  --registry URL   시험할 Registry URL`,
	},
	"install": {
		title: "Market 스킨 설치",
		body: `Registry checksum, 압축 경로, manifest와 NUBO 호환성을 검증한 뒤 app/skins에 설치합니다.
기존 폴더는 덮어쓰지 않으며 안전한 삭제를 위한 파일별 checksum 영수증을 함께 기록합니다.

사용법:
  nuboctl market install nubo-awesome-gallery
  nuboctl market install nubo-awesome-gallery --version 1.0.0

옵션:
  --version X.Y.Z  설치할 정확한 버전
  --source PATH    NUBO 소스 checkout 경로
  --registry URL   시험할 Registry URL

설치 뒤 nuboctl customize로 빌드·적용하세요.`,
	},
	"remove": {
		title: "Market 스킨 안전 삭제",
		body: `market install이 기록한 영수증과 현재 파일을 비교해 변경되지 않은 스킨만 삭제합니다.
수정·추가·누락 파일, 링크, 손상되거나 없는 영수증은 삭제를 거부하며 --force는 제공하지 않습니다.

사용법:
  nuboctl market remove nubo-awesome-gallery --dry-run
  nuboctl market remove nubo-awesome-gallery

옵션:
  --dry-run        검사 결과와 삭제 영향을 보고 실제 파일은 유지
  --source PATH    NUBO 소스 checkout 경로

사용 중인 스킨은 관리화면에서 먼저 다른 스킨으로 전환하세요. 삭제 뒤 nuboctl customize로 반영합니다.`,
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

func printMarketHelp(topic string) bool {
	page, ok := marketHelpPages[topic]
	if !ok {
		return false
	}
	fmt.Fprintln(os.Stdout, paint(os.Stdout, ansiBoldCyan, page.title))
	fmt.Fprintln(os.Stdout)
	fmt.Fprintln(os.Stdout, page.body)
	return true
}
