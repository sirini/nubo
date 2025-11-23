import { VISIT_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event) as { userUid?: number }
  const ua = getHeader(event, "user-agent") || ""

  if (/\b(bot|spider|crawl)\b/i.test(ua)) {
    return { skipped: true, reason: "bot" }
  }

  const today = new Date().toISOString().slice(0, 10)
  const last = getCookie(event, VISIT_KEY) || ""
  if (last === today) {
    return { skipped: true }
  }

  setCookie(event, VISIT_KEY, today, {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
  })

  return proxyRequest(event, `${config.apiBaseInternal}/home/visit?userUid=${query.userUid}`)
})
