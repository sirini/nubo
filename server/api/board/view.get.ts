import type { BoardViewResult } from "~/types/board"
import { AUTH_KEY, HIT_KEY, type Resp } from "~/types/common"

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

  const isAlreadyViewed = viewedPosts.includes(postUid)
  const needUpdateHit = isAlreadyViewed ? 0 : 1
  const token = getCookie(event, AUTH_KEY)

  try {
    //
    // TODO: 하이드레이션 미스매치 문제 해결
    //
    const response = await $fetch<Resp<BoardViewResult>>("/board/view", {
      baseURL: config.apiBaseInternal,
      method: "GET",
      query: {
        id,
        postUid,
        needUpdateHit,
        latestLimit,
      },
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (response.success && needUpdateHit === 1) {
      viewedPosts.push(postUid)
      setCookie(event, HIT_KEY, JSON.stringify(viewedPosts), {
        path: "/",
        maxAge: 60 * 60 * 24,
      })
    }

    return response
  } catch (e: any) {
    throw createError({
      status: e.response?.status || 500,
      statusText: e.response?.statusText || "Internal Server Error",
      data: e.data,
    })
  }
})
