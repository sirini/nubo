package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
)

type updateLock struct {
	file *os.File
}

// 같은 설치에서 두 update가 migration과 링크 전환을 겹쳐 실행하지 못하게 한다.
func acquireUpdateLock(currentLink string) (*updateLock, error) {
	path := filepath.Join(filepath.Dir(currentLink), ".nubo-update.lock")
	file, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0o600)
	if err != nil {
		return nil, fmt.Errorf("update 잠금 파일 생성 실패: %w", err)
	}
	if err := syscall.Flock(int(file.Fd()), syscall.LOCK_EX|syscall.LOCK_NB); err != nil {
		file.Close()
		if errors.Is(err, syscall.EWOULDBLOCK) {
			return nil, fmt.Errorf("다른 nuboctl update가 진행 중입니다")
		}
		return nil, fmt.Errorf("update 잠금 실패: %w", err)
	}
	return &updateLock{file: file}, nil
}

// 프로세스 안에서 명시적으로 잠금을 풀고 파일 descriptor를 닫는다.
func (lock *updateLock) close() {
	if lock == nil || lock.file == nil {
		return
	}
	_ = syscall.Flock(int(lock.file.Fd()), syscall.LOCK_UN)
	_ = lock.file.Close()
}
