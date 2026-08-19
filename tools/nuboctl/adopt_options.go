package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

type adoptOptions struct {
	releaseDir      string
	sourceDir       string
	currentLink     string
	envFile         string
	stateDir        string
	systemdDir      string
	osReleaseFile   string
	nodeBinary      string
	dryRun          bool
	nonInteractive  bool
	backupConfirmed bool
	confirmBackup   func() (bool, error)
}

// 기존 소스 설치를 prebuilt 운영 체제로 전환할 경로와 확인 옵션을 읽는다.
func parseAdoptOptions(args []string) (adoptOptions, error) {
	options := adoptOptions{
		releaseDir: detectReleaseDir(), currentLink: "/opt/nubo/current",
		envFile: environmentFilePath(), stateDir: "/var/lib/nubo",
		systemdDir: "/etc/systemd/system", osReleaseFile: "/etc/os-release",
	}
	flags := flag.NewFlagSet("adopt", flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	flags.StringVar(&options.releaseDir, "release", options.releaseDir, "다운로드해 배치한 공식 릴리스")
	flags.StringVar(&options.sourceDir, "source", "", "기존 NUBO 소스 프로젝트")
	flags.StringVar(&options.currentLink, "current", options.currentLink, "새 current 릴리스 링크")
	flags.StringVar(&options.envFile, "env", options.envFile, "새 운영 환경 파일")
	flags.StringVar(&options.stateDir, "state", options.stateDir, "새 상태 데이터 디렉터리")
	flags.StringVar(&options.systemdDir, "systemd-dir", options.systemdDir, "systemd unit 디렉터리")
	flags.StringVar(&options.osReleaseFile, "os-release", options.osReleaseFile, "운영체제 정보 파일")
	flags.StringVar(&options.nodeBinary, "node", "", "Node.js 실행 파일")
	flags.BoolVar(&options.dryRun, "dry-run", false, "변경 없이 전환 계획만 출력")
	flags.BoolVar(&options.nonInteractive, "non-interactive", false, "질문 없이 명시 옵션만 사용")
	flags.BoolVar(&options.backupConfirmed, "backup-confirmed", false, "외부 백업 완료를 명시적으로 확인")
	if err := flags.Parse(args); err != nil {
		return adoptOptions{}, err
	}
	if flags.NArg() != 0 || options.sourceDir == "" {
		return adoptOptions{}, fmt.Errorf("adopt에는 --source 기존-NUBO-경로가 필요합니다")
	}
	for _, path := range []*string{&options.releaseDir, &options.sourceDir, &options.currentLink, &options.envFile, &options.stateDir, &options.systemdDir, &options.osReleaseFile} {
		absolute, err := filepath.Abs(*path)
		if err != nil {
			return adoptOptions{}, err
		}
		*path = absolute
	}
	return options, nil
}
