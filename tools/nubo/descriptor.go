package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type releaseArtifact struct {
	Name     string `json:"name"`
	Checksum string `json:"checksum"`
}

type runtimeArtifact struct {
	releaseArtifact
	MigrationRequired bool `json:"migrationRequired"`
}

type releaseSources struct {
	SchemaVersion int `json:"schemaVersion"`
	Channel       struct {
		Version    string `json:"version"`
		Tag        string `json:"tag"`
		Repository string `json:"repository"`
	} `json:"channel"`
	Target struct {
		OS   string `json:"os"`
		Arch string `json:"arch"`
	} `json:"target"`
	APIContract string          `json:"apiContract"`
	CLI         releaseArtifact `json:"cli"`
	Runtime     runtimeArtifact `json:"runtime"`
	GOAPI       struct {
		Repository string `json:"repository"`
		Commit     string `json:"commit"`
	} `json:"goapi"`
}

var (
	semanticVersion = regexp.MustCompile(`^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$`)
	commitHash      = regexp.MustCompile(`^[a-f0-9]{40}$`)
	assetName       = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._+-]*$`)
)

func loadReleaseSources(root string, getenv func(string) string) (releaseSources, error) {
	path := filepath.Join(root, "deploy", "release-sources.json")
	content, err := os.ReadFile(path)
	if err != nil {
		return releaseSources{}, fmt.Errorf("runtime descriptor를 읽을 수 없습니다: %w", err)
	}
	var sources releaseSources
	decoder := json.NewDecoder(bytes.NewReader(content))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&sources); err != nil {
		return releaseSources{}, fmt.Errorf("runtime descriptor 형식이 올바르지 않습니다: %w", err)
	}
	if !hasRequiredBoolean(content, "runtime", "migrationRequired") {
		return releaseSources{}, errorsForDescriptor("runtime migrationRequired")
	}
	if sources.SchemaVersion != 2 {
		return releaseSources{}, fmt.Errorf("지원하지 않는 runtime descriptor입니다: schema %d", sources.SchemaVersion)
	}
	if !semanticVersion.MatchString(sources.Channel.Version) || sources.Channel.Tag != "v"+sources.Channel.Version {
		return releaseSources{}, errorsForDescriptor("channel version 또는 tag")
	}
	repositoryName := regexp.MustCompile(`^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$`)
	if !repositoryName.MatchString(sources.Channel.Repository) {
		return releaseSources{}, errorsForDescriptor("channel repository")
	}
	if sources.Target.OS != "linux" || sources.Target.Arch != "amd64" {
		return releaseSources{}, errorsForDescriptor("target")
	}
	if !regexp.MustCompile(`^\d+$`).MatchString(sources.APIContract) ||
		!repositoryName.MatchString(sources.GOAPI.Repository) || !commitHash.MatchString(sources.GOAPI.Commit) {
		return releaseSources{}, errorsForDescriptor("API contract 또는 GOAPI commit")
	}
	for label, artifact := range map[string]releaseArtifact{"CLI": sources.CLI, "runtime": sources.Runtime.releaseArtifact} {
		if !assetName.MatchString(artifact.Name) || !assetName.MatchString(artifact.Checksum) {
			return releaseSources{}, errorsForDescriptor(label + " artifact")
		}
	}
	expectedRuntime := fmt.Sprintf("nubo-runtime-%s-linux-amd64.tar.gz", sources.Channel.Version)
	if sources.CLI.Name != "nubo-linux-amd64" || sources.CLI.Checksum != sources.CLI.Name+".sha256" ||
		sources.Runtime.Name != expectedRuntime || sources.Runtime.Checksum != sources.Runtime.Name+".sha256" {
		return releaseSources{}, errorsForDescriptor("artifact 이름")
	}
	configuredVersion, err := readEnvSetting(filepath.Join(root, "env.sample"), "NUXT_PUBLIC_VERSION")
	if err != nil {
		return releaseSources{}, err
	}
	if configuredVersion != sources.Channel.Version {
		return releaseSources{}, fmt.Errorf("NUBO 버전과 runtime descriptor가 다릅니다: %s != %s", configuredVersion, sources.Channel.Version)
	}
	if baseURL := strings.TrimSpace(getenv("NUBO_RELEASE_BASE_URL")); baseURL != "" {
		parsed, parseErr := url.Parse(baseURL)
		if parseErr != nil || parsed == nil {
			return releaseSources{}, errorsForDescriptor("NUBO_RELEASE_BASE_URL")
		}
		localHTTP := parsed.Scheme == "http" && (parsed.Hostname() == "127.0.0.1" || parsed.Hostname() == "localhost" || parsed.Hostname() == "::1")
		if (parsed.Scheme != "https" && !localHTTP) || parsed.Host == "" || parsed.User != nil {
			return releaseSources{}, errorsForDescriptor("NUBO_RELEASE_BASE_URL")
		}
	}
	return sources, nil
}

func hasRequiredBoolean(content []byte, object, field string) bool {
	var root map[string]json.RawMessage
	if err := json.Unmarshal(content, &root); err != nil {
		return false
	}
	nested := root
	if object != "" {
		nested = nil
		if err := json.Unmarshal(root[object], &nested); err != nil {
			return false
		}
	}
	value, present := nested[field]
	boolean := strings.TrimSpace(string(value))
	return present && (boolean == "true" || boolean == "false")
}

func errorsForDescriptor(field string) error {
	return fmt.Errorf("runtime descriptor의 %s 값이 올바르지 않습니다", field)
}

func readEnvSetting(path, key string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()
	prefix := key + "="
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		if strings.HasPrefix(scanner.Text(), prefix) {
			value := strings.TrimSpace(strings.TrimPrefix(scanner.Text(), prefix))
			if value == "" {
				break
			}
			return value, nil
		}
	}
	if err := scanner.Err(); err != nil {
		return "", err
	}
	return "", fmt.Errorf("%s에서 %s를 찾을 수 없습니다", path, key)
}

func (sources releaseSources) releaseBase(override string) string {
	if value := strings.TrimRight(strings.TrimSpace(override), "/"); value != "" {
		return value
	}
	return fmt.Sprintf("https://github.com/%s/releases/download/%s", sources.Channel.Repository, sources.Channel.Tag)
}
