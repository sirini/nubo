import { AUTH_KEY, HIT_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const latestLimit = parseInt(query.latestLimit as string)
  const id = query.id as string
  const postUid = parseInt(query.postUid as string)
  const viewed = getCookie(event, HIT_KEY) || "[]"

  let viewedPosts: number[] = []
  try {
    viewedPosts = JSON.parse(viewed)
  } catch {
    viewedPosts = []
  }

  // 조회수 업데이트 여부 체크 (24시간 내 중복 업데이트 금지)
  let needUpdateHit = 0
  if (!viewedPosts.includes(postUid)) {
    needUpdateHit = 1
    viewedPosts.push(postUid)

    setCookie(event, HIT_KEY, JSON.stringify(viewedPosts), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    })
  }

  const token = getCookie(event, AUTH_KEY)
  return proxyRequest(
    event,
    `${config.apiBaseInternal}/board/view?id=${id}&postUid=${postUid}&needUpdateHit=${needUpdateHit}&latestLimit=${latestLimit}`,
    {
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  )
})
