package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

type runtimeMove struct {
	source string
	target string
	backup string
	moved  bool
	saved  bool
}

func installRuntime(root, stageRoot string, manifest runtimeManifest, receipt runtimeReceipt) error {
	receiptSource := filepath.Join(stageRoot, ".runtime-receipt.json")
	manifestSource := filepath.Join(stageRoot, ".runtime-installed-manifest.json")
	if err := writeJSONAtomic(receiptSource, receipt, 0644); err != nil {
		return err
	}
	if err := writeJSONAtomic(manifestSource, manifest, 0644); err != nil {
		return err
	}
	backupRoot, err := os.MkdirTemp(filepath.Join(root, ".nubo"), "runtime-backup-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(backupRoot)
	moves := []*runtimeMove{
		{source: filepath.Join(stageRoot, "bin", "goapi"), target: filepath.Join(root, "bin", "goapi"), backup: filepath.Join(backupRoot, "goapi")},
		{source: filepath.Join(stageRoot, "lib"), target: filepath.Join(root, "lib"), backup: filepath.Join(backupRoot, "lib")},
		{source: filepath.Join(stageRoot, "licenses", "sharp-libvips"), target: filepath.Join(root, "licenses", "sharp-libvips"), backup: filepath.Join(backupRoot, "sharp-libvips")},
		{source: receiptSource, target: filepath.Join(root, ".nubo", "runtime.json"), backup: filepath.Join(backupRoot, "runtime.json")},
		{source: manifestSource, target: filepath.Join(root, ".nubo", "runtime-manifest.json"), backup: filepath.Join(backupRoot, "runtime-manifest.json")},
	}
	rollback := func(original error) error {
		for index := len(moves) - 1; index >= 0; index-- {
			item := moves[index]
			if item.moved {
				_ = os.RemoveAll(item.target)
			}
			if item.saved {
				_ = os.MkdirAll(filepath.Dir(item.target), 0755)
				_ = os.Rename(item.backup, item.target)
			}
		}
		return fmt.Errorf("runtime 설치를 복구했습니다: %w", original)
	}
	for _, item := range moves {
		if err := os.MkdirAll(filepath.Dir(item.target), 0755); err != nil {
			return rollback(err)
		}
		if _, err := os.Lstat(item.target); err == nil {
			if err := os.Rename(item.target, item.backup); err != nil {
				return rollback(err)
			}
			item.saved = true
		} else if !errors.Is(err, os.ErrNotExist) {
			return rollback(err)
		}
		if err := os.Rename(item.source, item.target); err != nil {
			return rollback(err)
		}
		item.moved = true
	}
	return nil
}

func readRuntimeReceipt(path string) (runtimeReceipt, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return runtimeReceipt{}, err
	}
	var receipt runtimeReceipt
	err = json.Unmarshal(content, &receipt)
	return receipt, err
}
