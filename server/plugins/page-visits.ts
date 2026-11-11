import { getCookie, getRequestURL } from "h3"
import { $fetch } from "ofetch"
import { AUTH_KEY } from "~/types/common"
import { trustedRequestPeer } from "../utils/requestPeer"

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:response", async (response, { event }) => {
    if (event.method !== "GET" || response.statusCode && response.statusCode >= 400) return
    const config = useRuntimeConfig()
    const token = getCookie(event, AUTH_KEY)
    const peer = trustedRequestPeer(event)
    const pathname = getRequestURL(event).pathname
    const base = config.app?.baseURL?.replace(/\/$/, "") || ""
    const path = base && pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : pathname === base ? "/" : pathname
    const record = (access?: string) => $fetch(`${config.apiBaseInternal}/home/page-visit`, {
      method: "POST",
      timeout: 2500,
      retry: 0,
      headers: {
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
        ...(peer ? { "X-Real-IP": peer } : {}),
      },
      body: { path },
    })
    try {
      try { await record(token) }
      catch (error) {
        // An expired or invalid session is an anonymous document access until reauthenticated.
        if (!token || (error as { statusCode?: number }).statusCode !== 401) throw error
        await record()
      }
    } catch {
      // Recording outages must not prevent ordinary visitors from opening pages.
      console.warn("Page access recording failed")
    }
  })
})
