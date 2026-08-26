package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type skinFork struct {
	fromKey, fromVersion, toKey, destination string
}

func forkSkin(options skinRegistryOptions, output io.Writer) error {
	root, receipt, source, _, err := inspectInstalledSkin(options)
	if err != nil {
		return err
	}
	skinsDir := filepath.Join(root, "app", "skins")
	destination := filepath.Join(skinsDir, options.forkKey)
	if err := ensureSkinDestinationAvailable(skinsDir, options.forkKey); err != nil {
		return err
	}
	staged, err := copySkinForFork(source, skinsDir, options.forkKey)
	if err != nil {
		return err
	}
	defer os.RemoveAll(filepath.Dir(staged))
	if err := rewriteForkManifest(filepath.Join(staged, "skin.json"), options.forkKey, receipt); err != nil {
		return err
	}
	if err := os.Rename(staged, destination); err != nil {
		return fmt.Errorf("fork 스킨을 설치할 수 없습니다: %w", err)
	}
	writeMarketFork(output, skinFork{fromKey: receipt.Key, fromVersion: receipt.Version, toKey: options.forkKey, destination: destination})
	return nil
}

func copySkinForFork(source, skinsDir, newKey string) (string, error) {
	temporary, err := os.MkdirTemp(skinsDir, ".nubo-skin-fork-")
	if err != nil {
		return "", err
	}
	destination := filepath.Join(temporary, newKey)
	if err := os.Mkdir(destination, 0755); err != nil {
		_ = os.RemoveAll(temporary)
		return "", err
	}
	err = filepath.WalkDir(source, func(filename string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		relative, err := filepath.Rel(source, filename)
		if err != nil || relative == "." || relative == skinReceiptName {
			return err
		}
		if entry.Type()&os.ModeSymlink != 0 {
			return fmt.Errorf("fork에 링크를 포함할 수 없습니다: %s", relative)
		}
		target := filepath.Join(destination, relative)
		if entry.IsDir() {
			return os.Mkdir(target, 0755)
		}
		if !entry.Type().IsRegular() {
			return fmt.Errorf("fork에 특수 파일을 포함할 수 없습니다: %s", relative)
		}
		return copyRegularFile(filename, target)
	})
	if err != nil {
		_ = os.RemoveAll(temporary)
		return "", err
	}
	return destination, nil
}

func copyRegularFile(source, destination string) error {
	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()
	output, err := os.OpenFile(destination, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(output, input)
	closeErr := output.Close()
	if copyErr != nil || closeErr != nil {
		return fmt.Errorf("fork 파일을 쓸 수 없습니다")
	}
	return nil
}

func rewriteForkManifest(filename, newKey string, receipt skinReceipt) error {
	contents, err := os.ReadFile(filename)
	if err != nil {
		return fmt.Errorf("fork할 skin.json을 읽을 수 없습니다: %w", err)
	}
	var manifest map[string]any
	if err := json.Unmarshal(contents, &manifest); err != nil || manifest["key"] != receipt.Key {
		return fmt.Errorf("fork할 skin.json의 key가 설치 영수증과 다릅니다")
	}
	manifest["key"] = newKey
	manifest["derived_from"] = map[string]string{"key": receipt.Key, "version": receipt.Version}
	updated, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filename, append(updated, '\n'), 0644)
}
