import { readdirSync, readFileSync } from "node:fs"
import { dirname, extname, join, relative, resolve, sep } from "node:path"
import { describe, expect, it } from "vitest"

const skinsRoot = resolve(process.cwd(), "app/skins")
const sourceExtensions = new Set([".js", ".ts", ".vue"])
const importPattern = /(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g

const filesUnder = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path) : sourceExtensions.has(extname(path)) ? [path] : []
  })

const importedSkin = (source: string, specifier: string) => {
  let target: string | undefined
  if (specifier.startsWith("~/skins/")) {
    target = resolve(skinsRoot, specifier.slice("~/skins/".length))
  } else if (specifier.startsWith(".")) {
    target = resolve(dirname(source), specifier)
  }
  if (!target) return undefined

  const pathFromSkins = relative(skinsRoot, target)
  if (pathFromSkins.startsWith(`..${sep}`) || pathFromSkins === "..") return undefined
  return pathFromSkins.split(sep)[0]
}

describe("skin package isolation", () => {
  it("does not import source files from another skin package", () => {
    const violations: string[] = []

    for (const source of filesUnder(skinsRoot)) {
      const sourceSkin = relative(skinsRoot, source).split(sep)[0]
      const code = readFileSync(source, "utf8")
      for (const match of code.matchAll(importPattern)) {
        const targetSkin = importedSkin(source, match[1])
        if (targetSkin && targetSkin !== sourceSkin) {
          violations.push(`${relative(skinsRoot, source)} -> ${match[1]}`)
        }
      }
    }

    expect(violations).toEqual([])
  })
})
