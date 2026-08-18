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

// 설치 전후에 필요한 플랫폼·릴리스·환경·의존성 검사를 모두 실행한다.
func runDoctor(options options, runner commandRunner) []checkResult {
	results := checkPlatform()
	results = append(results, checkImageCPU("/proc/cpuinfo"))
	results = append(results, checkRelease(options.releaseDir, true)...)
	environmentResults, values := checkEnvironment(options, false)
	results = append(results, environmentResults...)
	results = append(results, checkNode(runner), checkSystemd(runner), checkNginx(runner))
	if values != nil {
		results = append(results, checkUpload(options, values, runner))
	}
	return results
}

// 설치된 서비스와 웹 상태를 빠르게 읽고 변경 없이 보고한다.
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

// 현재 CPU와 운영체제가 공식 지원 범위인지 진단한다.
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

// PATH의 Node.js가 실행되고 지원 버전 범위에 드는지 확인한다.
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

// Node.js 버전 문자열을 해석해 현재 지원 범위를 적용한다.
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

// systemctl이 존재하고 정상적으로 버전을 보고하는지 확인한다.
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

// Nginx 설치 여부와 현재 전체 설정의 문법을 확인한다.
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

// 업로드 경로와 서비스 사용자의 실제 쓰기 권한을 확인한다.
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

// 지정한 systemd 서비스가 active 상태인지 확인한다.
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

// 상태 URL이 200과 정상 상태 JSON을 반환하는지 확인한다.
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

// 긴 명령 출력을 사용자가 읽을 수 있는 짧은 오류 한 줄로 줄인다.
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
