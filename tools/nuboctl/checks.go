package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/user"
	"runtime"
	"strconv"
	"strings"
	"time"
)

func runDoctor(options options, runner commandRunner) []checkResult {
	results := checkPlatform()
	results = append(results, checkRelease(options.releaseDir, true)...)
	environmentResults, values := checkEnvironment(options, false)
	results = append(results, environmentResults...)
	results = append(results, checkNode(runner), checkLibvips(runner), checkSystemd(runner), checkNginx(runner))
	if values != nil {
		results = append(results, checkUpload(options, values, runner))
	}
	return results
}

func runStatus(options options, runner commandRunner) []checkResult {
	results := checkRelease(options.releaseDir, false)
	environmentResults, values := checkEnvironment(options, true)
	results = append(results, environmentResults...)
	for _, service := range []string{"nubo-goapi.service", "nubo-web.service"} {
		results = append(results, checkService(runner, service))
	}
	results = append(results, checkService(runner, "nginx.service"))
	if values != nil {
		results = append(results, checkUpload(options, values, runner))
		baseURL := webBaseURL(options, values)
		for _, endpoint := range []string{"/health", "/ready", "/version"} {
			results = append(results, checkHTTP(baseURL+endpoint))
		}
	}
	return results
}

func checkPlatform() []checkResult {
	results := make([]checkResult, 0, 2)
	if runtime.GOOS != "linux" || runtime.GOARCH != "amd64" {
		results = append(results, fail("플랫폼", runtime.GOOS+"/"+runtime.GOARCH+"는 현재 공식 지원 대상이 아닙니다"))
	} else {
		results = append(results, pass("플랫폼", "linux/amd64"))
	}
	values, err := readEnvironment("/etc/os-release")
	if err != nil {
		return append(results, warn("운영체제", err.Error()))
	}
	id := values["ID"]
	version := values["VERSION_ID"]
	if id == "ubuntu" && (version == "22.04" || version == "24.04") {
		results = append(results, pass("운영체제", "Ubuntu "+version))
	} else {
		results = append(results, warn("운영체제", id+" "+version+"는 공식 검증 대상이 아닙니다"))
	}
	return results
}

func checkNode(runner commandRunner) checkResult {
	if !commandExists(runner, "node") {
		return fail("Node.js", "실행 파일을 찾을 수 없습니다")
	}
	output, err := runner.run("node", "--version")
	if err != nil {
		return fail("Node.js", compactOutput(output, err))
	}
	if err := validateNodeVersion(output); err != nil {
		return fail("Node.js", err.Error())
	}
	return pass("Node.js", strings.TrimPrefix(strings.TrimSpace(output), "v"))
}

func validateNodeVersion(output string) error {
	version := strings.TrimPrefix(strings.TrimSpace(output), "v")
	parts := strings.Split(version, ".")
	if len(parts) < 2 {
		return fmt.Errorf("버전을 해석할 수 없습니다: %s", version)
	}
	major, majorErr := strconv.Atoi(parts[0])
	minor, minorErr := strconv.Atoi(parts[1])
	if majorErr != nil || minorErr != nil || major < 24 || major >= 27 || (major == 24 && minor < 11) {
		return fmt.Errorf("%s은 지원 범위 >=24.11.0 <27 밖입니다", version)
	}
	return nil
}

func checkLibvips(runner commandRunner) checkResult {
	if commandExists(runner, "pkg-config") {
		if output, err := runner.run("pkg-config", "--modversion", "vips"); err == nil {
			return pass("libvips", strings.TrimSpace(output))
		}
	}
	if commandExists(runner, "ldconfig") {
		if output, err := runner.run("ldconfig", "-p"); err == nil && strings.Contains(output, "libvips.so.42") {
			return pass("libvips", "libvips.so.42")
		}
	}
	return fail("libvips", "libvips.so.42를 찾을 수 없습니다")
}

func checkSystemd(runner commandRunner) checkResult {
	if !commandExists(runner, "systemctl") {
		return fail("systemd", "systemctl을 찾을 수 없습니다")
	}
	output, err := runner.run("systemctl", "--version")
	if err != nil {
		return fail("systemd", compactOutput(output, err))
	}
	line, _, _ := strings.Cut(strings.TrimSpace(output), "\n")
	return pass("systemd", line)
}

func checkNginx(runner commandRunner) checkResult {
	if !commandExists(runner, "nginx") {
		return fail("Nginx", "실행 파일을 찾을 수 없습니다")
	}
	output, err := runner.run("nginx", "-t")
	if err != nil {
		return fail("Nginx 설정", compactOutput(output, err))
	}
	return pass("Nginx 설정", "nginx -t 통과")
}

func checkUpload(options options, values map[string]string, runner commandRunner) checkResult {
	directory := uploadDirectory(options, values)
	info, err := os.Stat(directory)
	if err != nil {
		return fail("업로드 디렉터리", directory+": "+err.Error())
	}
	if !info.IsDir() {
		return fail("업로드 디렉터리", directory+"는 디렉터리가 아닙니다")
	}
	if current, err := user.Current(); err == nil && current.Uid == "0" && options.serviceUser != "" {
		if !commandExists(runner, "runuser") {
			return warn("업로드 쓰기 권한", "runuser가 없어 "+options.serviceUser+" 사용자 권한을 확인하지 못했습니다")
		}
		if output, err := runner.run("runuser", "-u", options.serviceUser, "--", "test", "-w", directory); err != nil {
			return fail("업로드 쓰기 권한", options.serviceUser+" 사용자가 쓸 수 없습니다: "+compactOutput(output, err))
		}
	}
	return pass("업로드 디렉터리", directory)
}

func checkService(runner commandRunner, service string) checkResult {
	if !commandExists(runner, "systemctl") {
		return fail(service, "systemctl을 찾을 수 없습니다")
	}
	output, err := runner.run("systemctl", "is-active", service)
	state := strings.TrimSpace(output)
	if err != nil || state != "active" {
		if state == "" {
			state = compactOutput(output, err)
		}
		return fail(service, state)
	}
	return pass(service, "active")
}

func checkHTTP(endpoint string) checkResult {
	client := http.Client{Timeout: 3 * time.Second}
	response, err := client.Get(endpoint)
	if err != nil {
		return fail(endpoint, err.Error())
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fail(endpoint, response.Status)
	}
	var payload map[string]any
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return fail(endpoint, "JSON 응답을 해석할 수 없습니다")
	}
	if status, ok := payload["status"].(string); !ok || (status != "ok" && status != "ready") {
		return fail(endpoint, "정상 상태가 아닙니다")
	}
	return pass(endpoint, response.Status)
}

func compactOutput(output string, err error) string {
	lines := strings.Fields(strings.TrimSpace(output))
	if len(lines) > 12 {
		lines = lines[len(lines)-12:]
	}
	if len(lines) > 0 {
		return strings.Join(lines, " ")
	}
	if err != nil {
		return err.Error()
	}
	return "알 수 없는 오류"
}
