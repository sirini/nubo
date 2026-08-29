package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

type cli struct {
	in      io.Reader
	out     io.Writer
	errOut  io.Writer
	getenv  func(string) string
	workdir func() (string, error)
}

func newCLI(in io.Reader, out, errOut io.Writer) *cli {
	return &cli{in: in, out: out, errOut: errOut, getenv: os.Getenv, workdir: os.Getwd}
}

func (c *cli) run(args []string) int {
	if len(args) == 0 {
		if c.interactive() {
			choice, err := runMenu(c.in, c.out, version, c.colorEnabled())
			if err != nil {
				return c.fail(err)
			}
			switch choice {
			case "download":
				return c.runDownload(nil)
			case "update":
				return c.runUpdate(nil)
			case "help":
				c.printHelp()
			}
			return 0
		}
		c.printHelp()
		return 0
	}

	switch args[0] {
	case "download":
		return c.runDownload(args[1:])
	case "update":
		return c.runUpdate(args[1:])
	case "version", "--version", "-v":
		fmt.Fprintf(c.out, "nubo %s\n", version)
		return 0
	case "help", "--help", "-h":
		c.printHelp()
		return 0
	default:
		fmt.Fprintf(c.errOut, "알 수 없는 명령입니다: %s\n\n", args[0])
		c.printHelpTo(c.errOut)
		return 2
	}
}

type updateFlags struct {
	root   string
	dryRun bool
	plain  bool
	json   bool
}

func (c *cli) runUpdate(args []string) int {
	flags := flag.NewFlagSet("update", flag.ContinueOnError)
	flags.SetOutput(c.errOut)
	options := updateFlags{}
	flags.StringVar(&options.root, "root", "", "NUBO 프로젝트 루트")
	flags.BoolVar(&options.dryRun, "dry-run", false, "다운로드·검증만 하고 CLI를 교체하지 않음")
	flags.BoolVar(&options.plain, "plain", false, "애니메이션 없는 평문 출력")
	flags.BoolVar(&options.json, "json", false, "결과를 JSON으로 출력")
	if err := flags.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		return c.invalid(fmt.Errorf("예상하지 못한 인자입니다: %s", flags.Arg(0)))
	}
	if options.json {
		options.plain = true
	}
	root, err := c.projectRoot(options.root)
	if err != nil {
		return c.fail(err)
	}
	descriptor, err := loadReleaseSources(root, c.getenv)
	if err != nil {
		return c.fail(err)
	}
	request := cliUpdateRequest{
		Root: root, Descriptor: descriptor, DryRun: options.dryRun,
		BaseURL: c.getenv("NUBO_RELEASE_BASE_URL"),
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	var result cliUpdateResult
	var runErr error
	task := func(emit func(taskEvent)) {
		result, runErr = updateCLI(ctx, request, emit)
	}
	if options.plain || !c.interactive() {
		taskOutput := c.out
		if options.json {
			taskOutput = c.errOut
		}
		runPlainTask(taskOutput, task)
	} else if err := runTaskUI(cancel, c.in, c.out, c.colorEnabled(), task); err != nil {
		return c.fail(err)
	}
	if runErr != nil {
		return c.fail(runErr)
	}
	if options.json {
		payload, _ := json.MarshalIndent(result, "", "  ")
		fmt.Fprintln(c.out, string(payload))
		return 0
	}
	printCLIUpdateResult(c.out, result, c.colorEnabled() && c.interactive())
	return 0
}

type downloadFlags struct {
	root   string
	yes    bool
	dryRun bool
	plain  bool
	json   bool
}

func (c *cli) runDownload(args []string) int {
	flags := flag.NewFlagSet("download", flag.ContinueOnError)
	flags.SetOutput(c.errOut)
	options := downloadFlags{}
	flags.StringVar(&options.root, "root", "", "NUBO 프로젝트 루트")
	flags.BoolVar(&options.yes, "yes", false, "기존 runtime 교체 확인 생략")
	flags.BoolVar(&options.dryRun, "dry-run", false, "다운로드·검증만 하고 설치하지 않음")
	flags.BoolVar(&options.plain, "plain", false, "애니메이션 없는 평문 출력")
	flags.BoolVar(&options.json, "json", false, "결과를 JSON으로 출력")
	if err := flags.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		return c.invalid(fmt.Errorf("예상하지 못한 인자입니다: %s", flags.Arg(0)))
	}
	if options.json {
		options.plain = true
	}

	root, err := c.projectRoot(options.root)
	if err != nil {
		return c.fail(err)
	}
	descriptor, err := loadReleaseSources(root, c.getenv)
	if err != nil {
		return c.fail(err)
	}
	existing := runtimeTargetsExist(root)
	if existing && !options.yes && !options.dryRun {
		if !c.interactive() {
			return c.fail(errors.New("기존 GOAPI 또는 libvips를 교체하려면 --yes가 필요합니다"))
		}
		confirmed, confirmErr := runConfirm(c.in, c.out, descriptor.Channel.Version, c.colorEnabled())
		if confirmErr != nil {
			return c.fail(confirmErr)
		}
		if !confirmed {
			fmt.Fprintln(c.out, "변경하지 않았습니다.")
			return 0
		}
	}

	request := runtimeRequest{
		Root:       root,
		Descriptor: descriptor,
		DryRun:     options.dryRun,
		BaseURL:    c.getenv("NUBO_RELEASE_BASE_URL"),
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	var result runtimeResult
	var runErr error
	task := func(emit func(taskEvent)) {
		result, runErr = downloadRuntime(ctx, request, emit)
	}

	if options.plain || !c.interactive() {
		taskOutput := c.out
		if options.json {
			taskOutput = c.errOut
		}
		runPlainTask(taskOutput, task)
	} else if err := runTaskUI(cancel, c.in, c.out, c.colorEnabled(), task); err != nil {
		return c.fail(err)
	}
	if runErr != nil {
		return c.fail(runErr)
	}
	if options.json {
		payload, _ := json.MarshalIndent(result, "", "  ")
		fmt.Fprintln(c.out, string(payload))
		return 0
	}
	printRuntimeResult(c.out, result, c.colorEnabled() && c.interactive())
	return 0
}

func (c *cli) projectRoot(explicit string) (string, error) {
	if explicit != "" {
		absolute, err := filepath.Abs(explicit)
		if err != nil {
			return "", err
		}
		if isProjectRoot(absolute) {
			return absolute, nil
		}
		return "", fmt.Errorf("NUBO 프로젝트 루트가 아닙니다: %s", absolute)
	}
	current, err := c.workdir()
	if err != nil {
		return "", err
	}
	for {
		if isProjectRoot(current) {
			return current, nil
		}
		parent := filepath.Dir(current)
		if parent == current {
			break
		}
		current = parent
	}
	return "", errors.New("NUBO 프로젝트를 찾지 못했습니다. 프로젝트 안에서 ./bin/nubo를 실행하세요")
}

func isProjectRoot(root string) bool {
	for _, name := range []string{"deploy/release-sources.json", "env.sample", "app/skins"} {
		if _, err := os.Stat(filepath.Join(root, filepath.FromSlash(name))); err != nil {
			return false
		}
	}
	return true
}

func (c *cli) interactive() bool {
	return isTerminal(c.in) && isTerminal(c.out) && c.getenv("TERM") != "dumb"
}

func (c *cli) colorEnabled() bool {
	return c.getenv("NO_COLOR") == ""
}

func isTerminal(value any) bool {
	file, ok := value.(*os.File)
	if !ok {
		return false
	}
	info, err := file.Stat()
	return err == nil && info.Mode()&os.ModeCharDevice != 0
}

func (c *cli) fail(err error) int {
	message := strings.TrimSpace(err.Error())
	fmt.Fprintf(c.errOut, "오류: %s\n", message)
	return 1
}

func (c *cli) invalid(err error) int {
	message := strings.TrimSpace(err.Error())
	fmt.Fprintf(c.errOut, "잘못된 사용법: %s\n", message)
	return 2
}

func (c *cli) printHelp() {
	c.printHelpTo(c.out)
}

func (c *cli) printHelpTo(writer io.Writer) {
	fmt.Fprintf(writer, `NUBO %s

검증된 NUBO 구성요소를 현재 작업 공간에 준비합니다.

사용법
  ./bin/nubo                     대화형 시작 화면
  ./bin/nubo download            GOAPI와 libvips 준비
  ./bin/nubo update              NUBO CLI 자체 업데이트
  ./bin/nubo version             CLI 버전 확인

download 옵션
  --dry-run                      다운로드와 검증만 수행
  --yes                          기존 runtime 교체 확인 생략
  --plain                        애니메이션 없는 출력
  --json                         자동화를 위한 JSON 결과

update 옵션
  --dry-run                      새 CLI를 검증만 하고 교체하지 않음
  --plain                        애니메이션 없는 출력
  --json                         자동화를 위한 JSON 결과

NUBO는 소스, 데이터베이스와 실행 중인 프로세스를 자동으로 변경하지 않습니다.
`, version)
}
