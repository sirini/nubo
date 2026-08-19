package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

const version = "0.9.6"

type options struct {
	releaseDir  string
	envFile     string
	stateDir    string
	serviceUser string
	webURL      string
}

// 명령 실행 결과를 운영체제 종료 코드로 전달한다.
func main() {
	os.Exit(run(os.Args[1:]))
}

// 하위 명령을 해석하고 사용자 오류와 검사 실패를 구분해 종료 코드를 반환한다.
func run(args []string) int {
	if len(args) == 0 {
		printUsage()
		return 2
	}

	switch args[0] {
	case "adopt":
		options, err := parseAdoptOptions(args[1:])
		if err != nil {
			if err == flag.ErrHelp {
				return 0
			}
			fmt.Fprintln(os.Stderr, err)
			return 2
		}
		if !options.nonInteractive && !options.backupConfirmed {
			options.confirmBackup = promptUpdateBackup(newTerminalPrompter(os.Stdin, os.Stdout))
		}
		if err := runAdopt(options, systemRunner{}, true); err != nil {
			fmt.Fprintln(os.Stderr, "adoption 실패:", err)
			return 1
		}
		return 0
	case "install":
		options, err := parseInstallOptions(args[1:])
		if err != nil {
			if err == flag.ErrHelp {
				return 0
			}
			fmt.Fprintln(os.Stderr, err)
			return 2
		}
		if options.nonInteractive {
			if options.domain == "" {
				fmt.Fprintln(os.Stderr, "비대화형 설치에는 --domain이 필요합니다")
				return 2
			}
			if _, statErr := os.Stat(options.envFile); os.IsNotExist(statErr) && options.envInput == "" {
				fmt.Fprintln(os.Stderr, "새 비대화형 설치에는 비밀값을 담은 --env-input 파일이 필요합니다")
				return 2
			}
		} else {
			options, err = promptInstallOptions(options, newTerminalPrompter(os.Stdin, os.Stdout))
			if err != nil {
				fmt.Fprintln(os.Stderr, "설치 입력 실패:", err)
				return 2
			}
		}
		if err := runInstall(options, systemRunner{}, true); err != nil {
			fmt.Fprintln(os.Stderr, "설치 준비 실패:", err)
			return 1
		}
		return 0
	case "activate-nginx":
		options, err := parseNginxActivationOptions(args[1:])
		if err != nil {
			if err == flag.ErrHelp {
				return 0
			}
			fmt.Fprintln(os.Stderr, err)
			return 2
		}
		if err := activateNginx(options, systemRunner{}, true); err != nil {
			fmt.Fprintln(os.Stderr, "Nginx 활성화 실패:", err)
			return 1
		}
		return 0
	case "update":
		options, err := parseUpdateOptions(args[1:])
		if err != nil {
			if err == flag.ErrHelp {
				return 0
			}
			fmt.Fprintln(os.Stderr, err)
			return 2
		}
		if options.nonInteractive && !options.dryRun && !options.backupConfirmed {
			fmt.Fprintln(os.Stderr, "비대화형 update에는 --backup-confirmed가 필요합니다")
			return 2
		}
		if !options.nonInteractive && !options.backupConfirmed {
			options.confirmBackup = promptUpdateBackup(newTerminalPrompter(os.Stdin, os.Stdout))
		}
		if err := runUpdate(options, systemRunner{}, waitForInstallReadiness, true); err != nil {
			fmt.Fprintln(os.Stderr, "update 실패:", err)
			return 1
		}
		return 0
	case "skin":
		if len(args) < 2 || args[1] != "apply" {
			fmt.Fprintln(os.Stderr, "사용법: nuboctl skin apply [옵션]")
			return 2
		}
		options, err := parseSiteApplyOptions(args[2:])
		if err != nil {
			if err == flag.ErrHelp {
				return 0
			}
			fmt.Fprintln(os.Stderr, err)
			return 2
		}
		if err := runSiteApply(options, systemRunner{}, waitForInstallReadiness, true); err != nil {
			fmt.Fprintln(os.Stderr, "스킨 적용 실패:", err)
			return 1
		}
		return 0
	case "doctor":
		options, err := parseOptions("doctor", args[1:])
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			return 2
		}
		return printReport(runDoctor(options, systemRunner{}))
	case "status":
		options, err := parseOptions("status", args[1:])
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			return 2
		}
		return printReport(runStatus(options, systemRunner{}))
	case "version", "--version", "-v":
		fmt.Printf("nuboctl %s\n", version)
		return 0
	case "help", "--help", "-h":
		printUsage()
		return 0
	default:
		fmt.Fprintf(os.Stderr, "알 수 없는 명령: %s\n", args[0])
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
		serviceUser: "nubo",
	}

	flags := flag.NewFlagSet(command, flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	flags.StringVar(&defaults.releaseDir, "release", defaults.releaseDir, "검사할 릴리스 디렉터리")
	flags.StringVar(&defaults.envFile, "env", defaults.envFile, "검사할 nubo.env 파일")
	flags.StringVar(&defaults.stateDir, "state", defaults.stateDir, "상태 데이터 디렉터리")
	flags.StringVar(&defaults.serviceUser, "user", defaults.serviceUser, "서비스 실행 사용자")
	flags.StringVar(&defaults.webURL, "web-url", "", "상태 엔드포인트 기본 URL")
	if err := flags.Parse(args); err != nil {
		return options{}, err
	}
	if flags.NArg() != 0 {
		return options{}, fmt.Errorf("예상하지 못한 인자: %s", flags.Arg(0))
	}

	for _, item := range []*string{&defaults.releaseDir, &defaults.envFile, &defaults.stateDir} {
		if absolute, err := filepath.Abs(*item); err == nil {
			*item = absolute
		}
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

// 현재 제공하는 명령의 짧은 사용법을 표준 오류에 출력한다.
func printUsage() {
	fmt.Fprintln(os.Stderr, "사용법: nuboctl <adopt|install|activate-nginx|update|skin|doctor|status|version> [옵션]")
}
