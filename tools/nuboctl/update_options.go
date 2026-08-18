package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

type updateOptions struct {
	candidateDir    string
	currentLink     string
	envFile         string
	stateDir        string
	serviceUser     string
	systemdDir      string
	osReleaseFile   string
	webURL          string
	dryRun          bool
	nonInteractive  bool
	backupConfirmed bool
	confirmBackup   func() (bool, error)
}

// update의 후보 릴리스와 기존 설치 경로를 읽는다.
func parseUpdateOptions(args []string) (updateOptions, error) {
	options := updateOptions{
		candidateDir:  detectReleaseDir(),
		currentLink:   "/opt/nubo/current",
		envFile:       environmentFilePath(),
		stateDir:      "/var/lib/nubo",
		serviceUser:   "nubo",
		systemdDir:    "/etc/systemd/system",
		osReleaseFile: "/etc/os-release",
	}
	flags := flag.NewFlagSet("update", flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	flags.StringVar(&options.candidateDir, "release", options.candidateDir, "미리 배치하고 압축을 푼 새 릴리스")
	flags.StringVar(&options.currentLink, "current", options.currentLink, "현재 서비스 릴리스 링크")
	flags.StringVar(&options.envFile, "env", options.envFile, "설치된 nubo.env 파일")
	flags.StringVar(&options.stateDir, "state", options.stateDir, "상태 데이터 디렉터리")
	flags.StringVar(&options.serviceUser, "user", options.serviceUser, "서비스 실행 사용자")
	flags.StringVar(&options.systemdDir, "systemd-dir", options.systemdDir, "설치된 systemd unit 디렉터리")
	flags.StringVar(&options.webURL, "web-url", "", "readiness 기본 URL")
	flags.BoolVar(&options.dryRun, "dry-run", false, "변경 없이 update 계획만 출력")
	flags.BoolVar(&options.nonInteractive, "non-interactive", false, "질문 없이 명시 옵션만 사용")
	flags.BoolVar(&options.backupConfirmed, "backup-confirmed", false, "외부 백업 완료를 명시적으로 확인")
	if err := flags.Parse(args); err != nil {
		return updateOptions{}, err
	}
	if flags.NArg() != 0 {
		return updateOptions{}, fmt.Errorf("예상하지 못한 인자: %s", flags.Arg(0))
	}
	for _, path := range []*string{&options.candidateDir, &options.currentLink, &options.envFile, &options.stateDir, &options.systemdDir, &options.osReleaseFile} {
		absolute, err := filepath.Abs(*path)
		if err != nil {
			return updateOptions{}, err
		}
		*path = absolute
	}
	return options, nil
}

// 대화형 update는 빈 동의가 아니라 BACKUP이라는 명시 입력을 요구한다.
func promptUpdateBackup(prompt terminalPrompter) func() (bool, error) {
	return func() (bool, error) {
		value, err := prompt.ask("외부 DB·업로드 백업을 완료했다면 BACKUP 입력", "")
		if err != nil {
			return false, err
		}
		return value == "BACKUP", nil
	}
}
