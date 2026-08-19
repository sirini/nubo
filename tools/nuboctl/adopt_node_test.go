package main

import "testing"

func TestNodeNeedsStagingOnlyForProtectedHome(t *testing.T) {
	for path, expected := range map[string]bool{
		"/home/operator/.nvm/versions/node/v22/bin/node": true,
		"/root/.nvm/versions/node/v22/bin/node":          true,
		"/usr/bin/node":                                  false,
		"/opt/node/bin/node":                             false,
	} {
		if actual := nodeNeedsStaging(path); actual != expected {
			t.Fatalf("nodeNeedsStaging(%s) = %t", path, actual)
		}
	}
}
