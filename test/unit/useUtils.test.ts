import { describe, expect, it } from "vitest"
import {
  getPreviewImage,
  getReadingTime,
  num,
  recoverChars,
  stripTags,
} from "../../app/composables/useUtils"

describe("content display utilities", () => {
  it("formats compact counts at the existing thresholds", () => {
    expect(num(999)).toBe("999")
    expect(num(1_000)).toBe("1.0K")
    expect(num(1_000_000)).toBe("1.0M")
  })

  it("normalizes stored excerpts for display and reading-time estimates", () => {
    const content = "<p>안녕하세요 &amp; 반갑습니다</p>"

    expect(stripTags(content)).toBe("안녕하세요 &amp; 반갑습니다")
    expect(recoverChars("&lt;NUBO&gt; &amp; community")).toBe("<NUBO> & community")
    expect(getReadingTime(content, 10)).toBe(2)
    expect(getReadingTime("", 10)).toBe(1)
  })

  it("maps list thumbnails to full preview images without losing query strings", () => {
    expect(getPreviewImage("/upload/thumbnails/2026/08/tphoto.webp?v=2")).toBe(
      "/upload/thumbnails/2026/08/fphoto.webp?v=2",
    )
    expect(getPreviewImage("/upload/original/photo.webp")).toBe("/upload/original/photo.webp")
  })
})
