package main

import "testing"

// TestNginxServerNameMatchesCoveredDomain은 exact·wildcard·정규식 도메인 충돌을 찾는지 확인한다.
func TestNginxServerNameMatchesCoveredDomain(t *testing.T) {
	for _, serverName := range []string{"community.example.com", "*.example.com", "~^community\\.example\\.com$", "~^community.example.com$"} {
		if !nginxServerNameMatches(serverName, "community.example.com") {
			t.Fatalf("%q이 대상 도메인을 포함하지 않는다고 판단했습니다", serverName)
		}
	}
	if nginxServerNameMatches("*.other.example", "community.example.com") {
		t.Fatal("관계없는 wildcard 도메인을 충돌로 판단했습니다")
	}
}
