package main

import "fmt"

func runAsUser(runner commandRunner, username, command string, args ...string) (string, error) {
	arguments := []string{"-u", username, "--", command}
	arguments = append(arguments, args...)
	return runner.run("runuser", arguments...)
}

// 기존 문서에서 사용한 표준 PM2 이름만 감지해 다른 앱에는 손대지 않는다.
func detectLegacyPM2Apps(username, pm2Binary string, runner commandRunner) []string {
	if !commandExists(runner, "runuser") {
		return nil
	}
	if pm2Binary == "" {
		if !commandExists(runner, "pm2") {
			return nil
		}
		pm2Binary = "pm2"
	}
	apps := make([]string, 0, len(legacyPM2Names))
	for _, name := range legacyPM2Names {
		if _, err := runAsUser(runner, username, pm2Binary, "describe", name); err == nil {
			apps = append(apps, name)
		}
	}
	return apps
}

func stopLegacyPM2Apps(username, pm2Binary string, apps []string, runner commandRunner) error {
	if pm2Binary == "" {
		pm2Binary = "pm2"
	}
	for _, name := range apps {
		if output, err := runAsUser(runner, username, pm2Binary, "stop", name); err != nil {
			restartLegacyPM2Apps(username, pm2Binary, apps, runner)
			return fmt.Errorf("기존 PM2 앱 %s 중지 실패: %s", name, compactOutput(output, err))
		}
	}
	return nil
}

func restartLegacyPM2Apps(username, pm2Binary string, apps []string, runner commandRunner) {
	if pm2Binary == "" {
		pm2Binary = "pm2"
	}
	for _, name := range apps {
		_, _ = runAsUser(runner, username, pm2Binary, "restart", name)
	}
}

func removeLegacyPM2Apps(username, pm2Binary string, apps []string, runner commandRunner) {
	if pm2Binary == "" {
		pm2Binary = "pm2"
	}
	for _, name := range apps {
		if output, err := runAsUser(runner, username, pm2Binary, "delete", name); err != nil {
			fmt.Printf("경고: 기존 PM2 앱 %s 삭제 실패: %s\n", name, compactOutput(output, err))
		}
	}
	if len(apps) > 0 {
		if output, err := runAsUser(runner, username, pm2Binary, "save"); err != nil {
			fmt.Printf("경고: PM2 부팅 목록 저장 실패: %s\n", compactOutput(output, err))
		}
	}
}
