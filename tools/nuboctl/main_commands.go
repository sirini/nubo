package main

import (
	"flag"
	"os"
	"strings"
)

func runAdoptCommand(args []string) int {
	options, err := parseAdoptOptions(args)
	if err != nil {
		return commandOptionError(err)
	}
	if !options.nonInteractive && !options.backupConfirmed {
		options.confirmBackup = promptUpdateBackup(newTerminalPrompter(os.Stdin, os.Stdout))
	}
	if err := runAdopt(options, systemRunner{}, true); err != nil {
		printFailure("기존 사이트 전환 실패: %v", err)
		return 1
	}
	return 0
}

func runInstallCommand(args []string) int {
	options, err := parseInstallOptions(args)
	if err != nil {
		return commandOptionError(err)
	}
	if options.nonInteractive {
		if code := validateAutomaticInstall(options); code != 0 {
			return code
		}
	} else if options, err = promptInstallOptions(options, newTerminalPrompter(os.Stdin, os.Stdout)); err != nil {
		printFailure("설치 정보를 읽지 못했습니다: %v", err)
		return 2
	}
	if err := runInstall(options, systemRunner{}, true); err != nil {
		printFailure("설치를 끝내지 못했습니다: %v", err)
		return 1
	}
	return 0
}

func validateAutomaticInstall(options installOptions) int {
	if options.domain == "" {
		printFailure("자동 설치에는 --domain이 필요합니다")
		return 2
	}
	if _, err := os.Stat(options.envFile); os.IsNotExist(err) && options.envInput == "" {
		printFailure("새 자동 설치에는 비밀값을 담은 --env-input 파일이 필요합니다")
		return 2
	}
	return 0
}

func runUpdateCommand(args []string) int {
	if !hasReleaseOption(args) {
		if err := runSourceWorkflow("update", args); err != nil {
			printFailure("업데이트 실패: %v", err)
			return 1
		}
		return 0
	}
	options, err := parseUpdateOptions(args)
	if err != nil {
		return commandOptionError(err)
	}
	if !options.nonInteractive && !options.backupConfirmed {
		options.confirmBackup = promptUpdateBackup(newTerminalPrompter(os.Stdin, os.Stdout))
	}
	if err := runUpdate(options, systemRunner{}, waitForInstallReadiness, true); err != nil {
		printFailure("업데이트 실패: %v", err)
		return 1
	}
	return 0
}

func runCustomizeCommand(args []string) int {
	if err := runSourceWorkflow("customize", args); err != nil {
		printFailure("사이트 꾸미기 적용 실패: %v", err)
		return 1
	}
	return 0
}

// skin은 기존 사이트 적용 명령과의 호환을 위해 남기고, 공개 Registry 기능은 market으로 모은다.
func runSkinCommand(args []string) int {
	if len(args) == 0 {
		printFailure("사용법: nuboctl skin <search|info|install|apply> [인자]")
		return 2
	}
	if args[0] != "apply" {
		return runMarketCommand(args)
	}
	options, err := parseSiteApplyOptions(args[1:])
	if err != nil {
		return commandOptionError(err)
	}
	if err := runSiteApply(options, systemRunner{}, waitForInstallReadiness, true); err != nil {
		printFailure("스킨 적용 실패: %v", err)
		return 1
	}
	return 0
}

func runMarketCommand(args []string) int {
	if len(args) == 0 {
		printMarketHelp("")
		return 0
	}
	if args[0] == "help" {
		if len(args) > 2 {
			printFailure("사용법: nuboctl market help [명령]")
			return 2
		}
		topic := ""
		if len(args) == 2 {
			topic = args[1]
		}
		if !printMarketHelp(topic) {
			printFailure("도움말을 찾을 수 없는 Market 명령입니다: %s", topic)
			return 2
		}
		return 0
	}
	if requestsHelp(args) {
		topic := ""
		if !strings.HasPrefix(args[0], "-") {
			topic = args[0]
		}
		if !printMarketHelp(topic) {
			printFailure("도움말을 찾을 수 없는 Market 명령입니다: %s", topic)
			return 2
		}
		return 0
	}
	if err := runSkinRegistry(args); err != nil {
		printFailure("Market 작업 실패: %v", err)
		return 1
	}
	return 0
}

func runHelpCommand(args []string) int {
	if len(args) > 1 {
		printFailure("사용법: nuboctl help [명령]")
		return 2
	}
	topic := ""
	if len(args) == 1 && args[0] != "--help" && args[0] != "-h" {
		topic = args[0]
	}
	if !printHelp(topic) {
		printFailure("도움말을 찾을 수 없는 명령입니다: %s", topic)
		printHelp("")
		return 2
	}
	return 0
}

func commandOptionError(err error) int {
	if err == flag.ErrHelp {
		return 0
	}
	printFailure("%v", err)
	return 2
}
