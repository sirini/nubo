import { type BoardViewResult } from "~/types/board"
import type { Resp } from "~/types/common"

export async function useBoardView() {
  const { $api } = useNuxtApp()
  const route = useRoute()
  const latestLimit = 5
  const id = route.params.id as string
  const postUid = parseInt(route.params.postUid as string)

  const { data, pending, error, refresh, execute } = await useAsyncData(
    `board-${id}-${postUid}`,
    () =>
      $api<Resp<BoardViewResult>>("/board/view", {
        method: "GET",
        params: {
          id,
          postUid,
          latestLimit,
        },
      }),
    {
      server: true,
      immediate: true,
    },
  )

  return { data, pending, error, refresh, execute }
}
