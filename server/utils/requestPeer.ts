import { BlockList, isIP } from "node:net"
import { getHeader, getRequestIP, type H3Event } from "h3"

export function trustedRequestPeer(event: H3Event): string | undefined {
  const normalize = (ip: string) => ip.startsWith("::ffff:") && isIP(ip.slice(7)) === 4 ? ip.slice(7) : ip
  const peer = normalize(getRequestIP(event) || "")
  if (!isIP(peer)) return undefined
  const trusted = new BlockList()
  for (const cidr of (process.env.NUBO_TRUSTED_PROXY_CIDRS || "").split(",")) {
    const [address, bits] = cidr.trim().split("/")
    if (!address || !bits || Number(bits) === 0 || !isIP(address)) continue
    try { trusted.addSubnet(address, Number(bits), isIP(address) === 4 ? "ipv4" : "ipv6") } catch { /* Invalid entries grant no trust. */ }
  }
  if (trusted.check(peer, isIP(peer) === 4 ? "ipv4" : "ipv6")) {
    // Official Nginx overwrites X-Real-IP. Never use the first arbitrary X-Forwarded-For value.
    const forwarded = normalize(getHeader(event, "x-real-ip") || "")
    if (isIP(forwarded)) return forwarded
  }
  return peer
}
