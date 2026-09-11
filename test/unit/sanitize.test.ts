import DOMPurify from "isomorphic-dompurify"
import { describe, expect, it, vi } from "vitest"
import { useSanitize } from "../../app/composables/useSanitize"

describe("SSR HTML sanitization", () => {
  it("does not retain hooks across callers and preserves safe links", () => {
    const existingHook = vi.fn()
    DOMPurify.addHook("afterSanitizeAttributes", existingHook)
    try {
      for (let i = 0; i < 100; i++) {
        const clean = useSanitize().sanitize('<a href="https://example.com" onclick="alert(1)">link</a><script>alert(1)</script>')
        expect(clean).toContain('target="_blank"')
        expect(clean).toContain('rel="noopener noreferrer"')
        expect(clean).not.toMatch(/onclick|<script/)
      }
      existingHook.mockClear()
      const independent = DOMPurify.sanitize('<a href="https://example.com">link</a>')
      expect(independent).not.toContain("target=")
      expect(existingHook).toHaveBeenCalled()
      expect(DOMPurify.removeHook("afterSanitizeAttributes")).toBe(existingHook)
      expect(DOMPurify.removeHook("afterSanitizeAttributes")).toBeUndefined()
    } finally {
      DOMPurify.removeHook("afterSanitizeAttributes", existingHook)
    }
  })

  it("releases its hook even when sanitization throws", () => {
    const invalid = { toString: () => { throw new Error("sanitizer failure") } }
    expect(() => useSanitize().sanitize(invalid as unknown as string)).toThrow("sanitizer failure")
    expect(DOMPurify.removeHook("afterSanitizeAttributes")).toBeUndefined()
  })
})
