import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const readEnvironmentSample = async () => {
  const contents = await readFile(new URL("../../env.sample", import.meta.url), "utf8")
  return Object.fromEntries(
    contents
      .split("\n")
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=")
        return [line.slice(0, separator), line.slice(separator + 1)]
      }),
  )
}

describe("shared runtime environment sample", () => {
  it("uses concrete Nuxt values that Node can load without variable expansion", async () => {
    const environment = await readEnvironmentSample()
    const nuxtEntries = Object.entries(environment).filter(([key]) => key.startsWith("NUXT_"))

    expect(nuxtEntries.length).toBeGreaterThan(0)
    for (const [key, value] of nuxtEntries) {
      expect(value, key).not.toContain("${")
    }
    expect(environment.NUXT_API_BASE_INTERNAL).toBe("http://127.0.0.1:3006/goapi")
    expect(environment.NUXT_PUBLIC_GOAPI_BASE).toBe(environment.GOAPI_BASE)
    expect(environment.NUXT_PUBLIC_VERSION).toBe(environment.GOAPI_VERSION)
    expect(environment.NUXT_PUBLIC_DOMAIN).toBe(environment.GOAPI_DOMAIN)
    expect(environment.NUXT_PUBLIC_TITLE).toBe(environment.GOAPI_TITLE)
  })
})
