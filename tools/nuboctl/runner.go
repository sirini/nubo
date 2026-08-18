package main

import (
	"bytes"
	"os/exec"
)

type commandRunner interface {
	lookPath(name string) (string, error)
	run(name string, args ...string) (string, error)
}

type systemRunner struct{}

// lookPath는 실제 시스템 PATH에서 명령 실행 파일을 찾는다.
func (systemRunner) lookPath(name string) (string, error) {
	return exec.LookPath(name)
}

// run은 외부 명령의 표준 출력과 오류를 합쳐 진단 가능한 결과로 반환한다.
func (systemRunner) run(name string, args ...string) (string, error) {
	command := exec.Command(name, args...)
	var output bytes.Buffer
	command.Stdout = &output
	command.Stderr = &output
	err := command.Run()
	return output.String(), err
}

// commandExists는 외부 명령을 현재 PATH에서 실행할 수 있는지 확인한다.
func commandExists(runner commandRunner, name string) bool {
	_, err := runner.lookPath(name)
	return err == nil
}
