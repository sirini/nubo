package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

const version = "0.10.0"

type options struct {
	releaseDir  string
	envFile     string
	stateDir    string
	serviceUser string
	userSet     bool
	systemdDir  string
	webURL      string
}

// 명령 실행 결과를 운영체제 종료 코드로 전달한다.
func main() {
	os.Exit(run(os.Args[1:]))
}

// 하위 명령을 해석하고 사용자 오류와 검사 실패를 구분해 종료 코드를 반환한다.
func run(args []string) int {
	if len(args) == 0 {
		printHelp("")
		return 0
	}
	if args[0] != "help" && len(args) > 1 && requestsHelp(args[1:]) {
		if printHelp(args[0]) {
			return 0
		}
	}

	switch args[0] {
	case "adopt":
		options, err := parseAdoptOptions(args[1:])
		if err != nil {
			if err == flag.ErrHelp {
				return 0
			}
			printFailure("%v", err)
			return 2
		}
		if !options.nonInteractive && !options.backupConfirmed {
			options.confirmBackup = promptUpdateBackup(newTerminalPrompter(os.Stdin, os.Stdout))
		}
		if err := runAdopt(options, systemRunner{}, true); err != nil {
			printFailure("기존 사이트 전환 실패: %v", err)
			return 1
		}
		return 0
	case "install":
		options, err := parseInstallOptions(args[1:])
		if err != nil {
			if err == flag.ErrHelp {
				return 0
			}
			printFailure("%v", err)
			return 2
		}
		if options.nonInteractive {
			if options.domain == "" {
				printFailure("자동 설치에는 --domain이 필요합니다")
				return 2
			}
			if _, statErr := os.Stat(options.envFile); os.IsNotExist(statErr) && options.envInput == "" {
				printFailure("새 자동 설치에는 비밀값을 담은 --env-input 파일이 필요합니다")
				return 2
			}
		} else {
			options, err = promptInstallOptions(options, newTerminalPrompter(os.Stdin, os.Stdout))
			if err != nil {
				printFailure("설치 정보를 읽지 못했습니다: %v", err)
				return 2
			}
		}
		if err := runInstall(options, systemRunner{}, true); err != nil {
			printFailure("설치를 끝내지 못했습니다: %v", err)
			return 1
		}
		return 0
	case "activate-nginx":
		options, err := parseNginxActivationOptions(args[1:])
		if err != nil {
			if err == flag.ErrHelp {
				return 0
			}
			printFailure("%v", err)
			return 2
		}
		if err := activateNginx(options, systemRunner{}, true); err != nil {
			printFailure("웹 공개 설정 실패: %v", err)
			return 1
		}
		return 0
	case "update":
		if !hasReleaseOption(args[1:]) {
			if err := runSourceWorkflow("update", args[1:]); err != nil {
				printFailure("업데이트 실패: %v", err)
				return 1
			}
			return 0
		}
		options, err := parseUpdateOptions(args[1:])
		if err != nil {
			if err == flag.ErrHelp {
				return 0
			}
			printFailure("%v", err)
			return 2
		}
		if options.nonInteractive && !options.dryRun && !options.backupConfirmed {
			printFailure("자동 업데이트에는 --backup-confirmed가 필요합니다")
			return 2
		}
		if !options.nonInteractive && !options.backupConfirmed {
			options.confirmBackup = promptUpdateBackup(newTerminalPrompter(os.Stdin, os.Stdout))
		}
		if err := runUpdate(options, systemRunner{}, waitForInstallReadiness, true); err != nil {
			printFailure("업데이트 실패: %v", err)
			return 1
		}
		return 0
	case "customize":
		if err := runSourceWorkflow("customize", args[1:]); err != nil {
			printFailure("사이트 꾸미기 적용 실패: %v", err)
			return 1
		}
		return 0
	case "skin":
		if len(args) < 2 || args[1] != "apply" {
			printFailure("사용법: nuboctl skin apply [옵션]")
			return 2
		}
		options, err := parseSiteApplyOptions(args[2:])
		if err != nil {
			if err == flag.ErrHelp {
				return 0
			}
			printFailure("%v", err)
			return 2
		}
		if err := runSiteApply(options, systemRunner{}, waitForInstallReadiness, true); err != nil {
			printFailure("스킨 적용 실패: %v", err)
			return 1
		}
		return 0
	case "doctor":
		options, err := parseOptions("doctor", args[1:])
		if err != nil {
			printFailure("%v", err)
			return 2
		}
		return printReport(runDoctor(options, systemRunner{}))
	case "status":
		options, err := parseOptions("status", args[1:])
		if err != nil {
			printFailure("%v", err)
			return 2
		}
		return printReport(runStatus(options, systemRunner{}))
	case "version", "--version", "-v":
		fmt.Printf("nuboctl %s\n", version)
		return 0
	case "help":
		if len(args) > 2 {
			printFailure("사용법: nuboctl help [명령]")
			return 2
		}
		topic := ""
		if len(args) == 2 && args[1] != "--help" && args[1] != "-h" {
			topic = args[1]
		}
		if !printHelp(topic) {
			printFailure("도움말을 찾을 수 없는 명령입니다: %s", topic)
			printHelp("")
			return 2
		}
		return 0
	case "--help", "-h":
		printHelp("")
		return 0
	default:
		printFailure("알 수 없는 명령: %s", args[0])
		printUsage()
		return 2
	}
}

// doctor와 status가 공유하는 경로·사용자 옵션을 읽는다.
func parseOptions(command string, args []string) (options, error) {
	defaults := options{
		releaseDir:  detectReleaseDir(),
		envFile:     environmentFilePath(),
		stateDir:    "/var/lib/nubo",
		serviceUser: "",
		systemdDir:  "/etc/systemd/system",
	}

	flags := flag.NewFlagSet(command, flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	flags.StringVar(&defaults.releaseDir, "release", defaults.releaseDir, "검사할 릴리스 디렉터리")
	flags.StringVar(&defaults.envFile, "env", defaults.envFile, "검사할 nubo.env 파일")
	flags.StringVar(&defaults.stateDir, "state", defaults.stateDir, "상태 데이터 디렉터리")
	flags.StringVar(&defaults.serviceUser, "user", defaults.serviceUser, "서비스 실행 사용자")
	flags.StringVar(&defaults.systemdDir, "systemd-dir", defaults.systemdDir, "설치된 systemd unit 디렉터리")
	flags.StringVar(&defaults.webURL, "web-url", "", "상태 엔드포인트 기본 URL")
	if err := flags.Parse(args); err != nil {
		return options{}, err
	}
	if flags.NArg() != 0 {
		return options{}, fmt.Errorf("예상하지 못한 인자: %s", flags.Arg(0))
	}
	flags.Visit(func(item *flag.Flag) {
		if item.Name == "user" {
			defaults.userSet = true
		}
	})

	for _, item := range []*string{&defaults.releaseDir, &defaults.envFile, &defaults.stateDir, &defaults.systemdDir} {
		if absolute, err := filepath.Abs(*item); err == nil {
			*item = absolute
		}
	}
	if defaults.serviceUser == "" {
		defaults.serviceUser = installedServiceUser(defaults.systemdDir)
	}
	return defaults, nil
}

// 명시된 공용 환경 파일 또는 Linux 기본 경로를 선택한다.
func environmentFilePath() string {
	if path := os.Getenv("NUBO_ENV_FILE"); path != "" {
		return path
	}
	return "/etc/nubo/nubo.env"
}

// 환경값이나 실행 파일 위치에서 현재 릴리스 경로를 찾는다.
func detectReleaseDir() string {
	if path := os.Getenv("NUBO_RELEASE_DIR"); path != "" {
		return path
	}
	if executable, err := os.Executable(); err == nil {
		if resolved := resolveExecutable(executable); resolved != "" {
			return resolved
		}
	}
	return "/opt/nubo/current"
}

// 실행 파일과 같은 디렉터리에 manifest가 있을 때 그 경로를 반환한다.
func resolveExecutable(executable string) string {
	resolved, err := filepath.EvalSymlinks(executable)
	if err != nil {
		resolved = executable
	}
	directory := filepath.Dir(resolved)
	if _, err := os.Stat(filepath.Join(directory, "manifest.json")); err == nil {
		return directory
	}
	return ""
}

// 알 수 없는 명령 뒤에도 입문 도움말을 다시 보여준다.
func printUsage() {
	printHelp("")
}
