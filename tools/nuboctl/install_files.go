package main

import (
	"errors"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"strconv"
)

// currentEUID는 테스트 가능한 이름으로 현재 프로세스의 유효 사용자 ID를 반환한다.
func currentEUID() int {
	return os.Geteuid()
}

// configDirectory는 환경 파일을 담을 설정 디렉터리를 반환한다.
func configDirectory(options installOptions) string {
	return filepath.Dir(options.envFile)
}

// preflightInstallFiles는 기존 파일이 예상 결과와 다르면 덮어쓰기 전에 설치를 중단한다.
func preflightInstallFiles(files []installFile) error {
	for _, file := range files {
		contents, err := os.ReadFile(file.path)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return err
		}
		if string(contents) != string(file.content) {
			return fmt.Errorf("기존 파일을 덮어쓰지 않습니다: %s", file.path)
		}
	}
	return nil
}

// sameFileContent는 설치 계획에서 기존 파일을 유지할 수 있는지 확인한다.
func sameFileContent(path string, expected []byte) bool {
	contents, err := os.ReadFile(path)
	return err == nil && string(contents) == string(expected)
}

// printIdentityPlan은 서비스 사용자와 그룹을 새로 만들지 유지할지 보여준다.
func printIdentityPlan(options installOptions) {
	if _, err := user.LookupGroup(options.serviceGroup); err != nil {
		fmt.Printf("- 생성: 시스템 그룹 %s\n", options.serviceGroup)
	} else {
		fmt.Printf("- 유지: 서비스 그룹 %s\n", options.serviceGroup)
	}
	if _, err := user.Lookup(options.serviceUser); err != nil {
		fmt.Printf("- 생성: 시스템 사용자 %s\n", options.serviceUser)
	} else {
		fmt.Printf("- 유지: 서비스 사용자 %s\n", options.serviceUser)
	}
}

// validateExistingUploadDirectory는 운영자 소유 경로를 바꾸지 않고 서비스 사용자의 쓰기 권한을 확인한다.
func validateExistingUploadDirectory(options installOptions, runner commandRunner) error {
	info, err := os.Stat(options.uploadDir)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("업로드 디렉터리 확인 실패: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("업로드 경로가 디렉터리가 아닙니다: %s", options.uploadDir)
	}
	if _, err := user.Lookup(options.serviceUser); err != nil {
		return nil
	}
	name := "test"
	args := []string{"-w", options.uploadDir}
	if currentEUID() == 0 {
		if !commandExists(runner, "runuser") {
			return fmt.Errorf("기존 업로드 경로의 권한 확인에 필요한 runuser를 찾을 수 없습니다")
		}
		name = "runuser"
		args = []string{"-u", options.serviceUser, "--", "test", "-w", options.uploadDir}
	}
	if output, err := runner.run(name, args...); err != nil {
		return fmt.Errorf("%s 사용자가 기존 업로드 디렉터리에 쓸 수 없습니다: %s; 소유권이나 권한을 먼저 조정하세요", options.serviceUser, compactOutput(output, err))
	}
	return nil
}

// ensureServiceIdentity는 지정된 시스템 그룹과 로그인 불가능한 서비스 사용자를 필요한 경우에만 만든다.
func ensureServiceIdentity(options installOptions, runner commandRunner) (int, int, error) {
	group, groupErr := user.LookupGroup(options.serviceGroup)
	if groupErr != nil {
		if !commandExists(runner, "groupadd") {
			return 0, 0, fmt.Errorf("그룹 %s이 없고 groupadd를 찾을 수 없습니다", options.serviceGroup)
		}
		if output, err := runner.run("groupadd", "--system", options.serviceGroup); err != nil {
			return 0, 0, fmt.Errorf("서비스 그룹 생성 실패: %s", compactOutput(output, err))
		}
		group, groupErr = user.LookupGroup(options.serviceGroup)
	}
	if groupErr != nil {
		return 0, 0, groupErr
	}
	account, accountErr := user.Lookup(options.serviceUser)
	if accountErr != nil {
		if !commandExists(runner, "useradd") {
			return 0, 0, fmt.Errorf("사용자 %s이 없고 useradd를 찾을 수 없습니다", options.serviceUser)
		}
		arguments := []string{"--system", "--gid", options.serviceGroup, "--home-dir", options.stateDir, "--shell", "/usr/sbin/nologin", options.serviceUser}
		if output, err := runner.run("useradd", arguments...); err != nil {
			return 0, 0, fmt.Errorf("서비스 사용자 생성 실패: %s", compactOutput(output, err))
		}
		account, accountErr = user.Lookup(options.serviceUser)
	}
	if accountErr != nil {
		return 0, 0, accountErr
	}
	uid, err := strconv.Atoi(account.Uid)
	if err != nil {
		return 0, 0, err
	}
	gid, err := strconv.Atoi(group.Gid)
	if err != nil {
		return 0, 0, err
	}
	return uid, gid, nil
}

// ensureInstallDirectory는 없는 디렉터리만 만들고 기존 운영자 경로의 권한은 변경하지 않는다.
func ensureInstallDirectory(path string, mode os.FileMode, uid, gid int) error {
	info, err := os.Stat(path)
	if err == nil {
		if !info.IsDir() {
			return fmt.Errorf("디렉터리 경로에 파일이 있습니다: %s", path)
		}
		return nil
	}
	if !os.IsNotExist(err) {
		return err
	}
	if err := os.MkdirAll(path, mode); err != nil {
		return err
	}
	if err := os.Chmod(path, mode); err != nil {
		return err
	}
	if currentEUID() == 0 {
		return os.Chown(path, uid, gid)
	}
	return nil
}

// installFileIfNeeded는 같은 파일은 보존하고 새 파일은 임시 파일과 hard link로 원자적으로 생성한다.
func installFileIfNeeded(file installFile) error {
	contents, err := os.ReadFile(file.path)
	if err == nil {
		if string(contents) == string(file.content) {
			return nil
		}
		return fmt.Errorf("기존 파일을 덮어쓰지 않습니다: %s", file.path)
	}
	if !os.IsNotExist(err) {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(file.path), 0o755); err != nil {
		return err
	}
	temporary, err := os.CreateTemp(filepath.Dir(file.path), ".nuboctl-*")
	if err != nil {
		return err
	}
	temporaryPath := temporary.Name()
	defer os.Remove(temporaryPath)
	if _, err := temporary.Write(file.content); err != nil {
		temporary.Close()
		return err
	}
	if err := temporary.Sync(); err != nil {
		temporary.Close()
		return err
	}
	if err := temporary.Chmod(file.mode); err != nil {
		temporary.Close()
		return err
	}
	if currentEUID() == 0 {
		if err := temporary.Chown(file.uid, file.gid); err != nil {
			temporary.Close()
			return err
		}
	}
	if err := temporary.Close(); err != nil {
		return err
	}
	if err := os.Link(temporaryPath, file.path); err != nil {
		if errors.Is(err, os.ErrExist) {
			return fmt.Errorf("설치 중 파일이 생성되어 덮어쓰지 않습니다: %s", file.path)
		}
		return err
	}
	return nil
}
