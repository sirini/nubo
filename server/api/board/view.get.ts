export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const hitKey = "nuboHit"
  const accessTokenKey = "nuboAccessToken"
  const query = getQuery(event)
  const latestLimit = parseInt(query.latestLimit as string)
  const id = query.id as string
  const postUid = parseInt(query.postUid as string)
  const viewed = getCookie(event, hitKey) || "[]"

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

    setCookie(event, hitKey, JSON.stringify(viewedPosts), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    })
  }

  const token = getCookie(event, accessTokenKey) || "empty"
  const res = await $fetch("/board/view", {
    baseURL: config.apiBaseInternal,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      id,
      postUid,
      needUpdateHit,
      latestLimit,
    },
  })

  return res
})
