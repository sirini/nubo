package main

import (
	"fmt"
	"path/filepath"
	"strings"
)

// 서비스 계정과 외부 환경 파일을 사용해 GOAPI의 DB 설치 명령을 실행한다.
func installDatabase(options installOptions, runner commandRunner) error {
	binary := filepath.Join(options.releaseDir, "bin", "goapi")
	environment := "NUBO_ENV_FILE=" + options.envFile
	name := "env"
	args := []string{environment, binary, "install"}
	if currentEUID() == 0 {
		if !commandExists(runner, "runuser") {
			return fmt.Errorf("서비스 계정으로 DB를 준비하려면 runuser 명령이 필요합니다")
		}
		name = "runuser"
		args = []string{"-u", options.serviceUser, "--", "env", environment, binary, "install"}
	}
	output, err := runner.run(name, args...)
	if err != nil {
		message := strings.TrimSpace(output)
		if message == "" {
			message = err.Error()
		}
		return fmt.Errorf("데이터베이스 준비 실패: %s", message)
	}
	return nil
}
