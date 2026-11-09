import { afterEach, describe, expect, it, vi } from "vitest"
import type { H3Event } from "h3"
import { trustedRequestPeer } from "../../server/utils/requestPeer"

const inputs = vi.hoisted(() => ({ peer: "203.0.113.20", forwarded: "198.51.100.41" }))
vi.mock("h3", () => ({ getRequestIP: () => inputs.peer, getHeader: (_event: unknown, name: string) => name === "x-real-ip" ? inputs.forwarded : undefined }))
afterEach(() => vi.unstubAllEnvs())
const event = {} as H3Event

describe("forwarded request identity", () => {
  it("ignores forged addresses unless the immediate peer is explicitly trusted", () => {
    vi.stubEnv("NUBO_TRUSTED_PROXY_CIDRS", "")
    expect(trustedRequestPeer(event)).toBe("203.0.113.20")
    vi.stubEnv("NUBO_TRUSTED_PROXY_CIDRS", "203.0.113.0/24")
    expect(trustedRequestPeer(event)).toBe("198.51.100.41")
    vi.stubEnv("NUBO_TRUSTED_PROXY_CIDRS", "0.0.0.0/0,not-a-prefix")
    expect(trustedRequestPeer(event)).toBe("203.0.113.20")
  })
  it("normalizes mapped loopback addresses and rejects malformed forwarded values", () => {
    inputs.peer = "::ffff:127.0.0.1"
    inputs.forwarded = "not-an-ip"
    vi.stubEnv("NUBO_TRUSTED_PROXY_CIDRS", "127.0.0.1/32")
    expect(trustedRequestPeer(event)).toBe("127.0.0.1")
    inputs.peer = "203.0.113.20"; inputs.forwarded = "198.51.100.41"
  })
})
