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

func (systemRunner) lookPath(name string) (string, error) {
	return exec.LookPath(name)
}

func (systemRunner) run(name string, args ...string) (string, error) {
	command := exec.Command(name, args...)
	var output bytes.Buffer
	command.Stdout = &output
	command.Stderr = &output
	err := command.Run()
	return output.String(), err
}

func commandExists(runner commandRunner, name string) bool {
	_, err := runner.lookPath(name)
	return err == nil
}
