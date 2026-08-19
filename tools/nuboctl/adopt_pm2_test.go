package main

import (
	"strings"
	"testing"
)

// wrapper가 찾은 사용자별 PM2 절대 경로로 표준 앱만 감지한다.
func TestDetectLegacyPM2AppsUsesExplicitBinary(t *testing.T) {
	pm2 := "/home/operator/.nvm/bin/pm2"
	runner := fakeRunner{
		paths: map[string]bool{"runuser": true},
		outputs: map[string]string{
			"runuser -u operator -- " + pm2 + " describe nubo-web": "online",
		},
		errors: map[string]error{
			"runuser -u operator -- " + pm2 + " describe nubo-api": errTestCommand,
		},
	}
	apps := detectLegacyPM2Apps("operator", pm2, runner)
	if strings.Join(apps, ",") != "nubo-web" {
		t.Fatalf("감지한 PM2 앱 = %v", apps)
	}
}
