package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

type siteApplyOptions struct {
	candidateDir  string
	currentLink   string
	envFile       string
	stateDir      string
	serviceUser   string
	systemdDir    string
	osReleaseFile string
	webURL        string
	dryRun        bool
}

// 로컬 스킨 빌드와 현재 설치를 연결할 경로를 읽는다.
func parseSiteApplyOptions(args []string) (siteApplyOptions, error) {
	options := siteApplyOptions{
		currentLink: "/opt/nubo/current", envFile: environmentFilePath(), stateDir: "/var/lib/nubo",
		systemdDir: "/etc/systemd/system", osReleaseFile: "/etc/os-release",
	}
	flags := flag.NewFlagSet("skin apply", flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	flags.StringVar(&options.candidateDir, "release", "", "로컬 스킨을 포함해 미리 배치한 파생 릴리스")
	flags.StringVar(&options.currentLink, "current", options.currentLink, "현재 서비스 릴리스 링크")
	flags.StringVar(&options.envFile, "env", options.envFile, "설치된 nubo.env 파일")
	flags.StringVar(&options.stateDir, "state", options.stateDir, "상태 데이터 디렉터리")
	flags.StringVar(&options.serviceUser, "user", "", "서비스 실행 사용자")
	flags.StringVar(&options.systemdDir, "systemd-dir", options.systemdDir, "설치된 systemd unit 디렉터리")
	flags.StringVar(&options.webURL, "web-url", "", "readiness 기본 URL")
	flags.BoolVar(&options.dryRun, "dry-run", false, "변경 없이 적용 계획만 출력")
	if err := flags.Parse(args); err != nil {
		return siteApplyOptions{}, err
	}
	if flags.NArg() != 0 || options.candidateDir == "" {
		return siteApplyOptions{}, fmt.Errorf("skin apply에는 --release 파생-릴리스-경로가 필요합니다")
	}
	for _, path := range []*string{&options.candidateDir, &options.currentLink, &options.envFile, &options.stateDir, &options.systemdDir, &options.osReleaseFile} {
		absolute, err := filepath.Abs(*path)
		if err != nil {
			return siteApplyOptions{}, err
		}
		*path = absolute
	}
	if options.serviceUser == "" {
		options.serviceUser = installedServiceUser(options.systemdDir)
	}
	return options, nil
}

func (site siteApplyOptions) updateOptions() updateOptions {
	return updateOptions{
		candidateDir: site.candidateDir, currentLink: site.currentLink, envFile: site.envFile,
		stateDir: site.stateDir, serviceUser: site.serviceUser, systemdDir: site.systemdDir,
		osReleaseFile: site.osReleaseFile, webURL: site.webURL, dryRun: site.dryRun,
	}
}
