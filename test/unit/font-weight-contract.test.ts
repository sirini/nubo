import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

describe("Pretendard variable font weight", () => {
  it("lets font-weight select the variable weight axis", () => {
    const fontCss = readFileSync(resolve(process.cwd(), "app/assets/css/font.css"), "utf8")
    const themeCss = readFileSync(
      resolve(process.cwd(), "app/skins/nubo-basic-layout/theme.css"),
      "utf8",
    )

    expect(fontCss).toContain('font-family: "Pretendard Variable"')
    expect(fontCss).toContain("font-weight: 45 920")
    expect(themeCss).not.toContain("font-variation-settings")
  })
})
