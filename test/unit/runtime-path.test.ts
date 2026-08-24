import { describe, expect, it } from "vitest"
import {
  joinRuntimePath,
  normalizeAppBaseURL,
  resolvePublicApiBase,
} from "../../app/utils/runtimePath"

describe("runtime application paths", () => {
  it("normalizes root and nested application base URLs", () => {
    expect(normalizeAppBaseURL(undefined)).toBe("/")
    expect(normalizeAppBaseURL("/sample")).toBe("/sample/")
    expect(normalizeAppBaseURL("/internal//sample/")).toBe("/internal/sample/")
    expect(() => normalizeAppBaseURL("https://example.com/sample")).toThrow("/로 시작하는 경로")
    expect(() => normalizeAppBaseURL("/sample/../admin")).toThrow("상대 경로 구간")
  })

  it("derives the browser API base from the application base", () => {
    expect(resolvePublicApiBase("/", "")).toBe("/api")
    expect(resolvePublicApiBase("/sample/", "")).toBe("/sample/api")
    expect(resolvePublicApiBase("/sample/", "https://api.example.com/")).toBe(
      "https://api.example.com",
    )
  })

  it("joins short-lived download and image paths below the API base", () => {
    expect(joinRuntimePath("/sample/api", "/board/original/transfer?token=abc")).toBe(
      "/sample/api/board/original/transfer?token=abc",
    )
  })
})
