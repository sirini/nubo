package main

import (
	"os"
)

var version = "dev"

func main() {
	os.Exit(newCLI(os.Stdin, os.Stdout, os.Stderr).run(os.Args[1:]))
}
