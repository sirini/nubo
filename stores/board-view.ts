import { defineStore } from "pinia"
import { fetchGet } from "~/lib/utils"
import { BOARD_VIEW_RESULT, type BoardViewResult } from "~/types/board"
import type { Resp } from "~/types/common"

export const useBoardViewStore = defineStore("board-view", () => {
  const route = useRoute()
  const latestLimit = ref<number>(5)
  const pending = ref<boolean>(false)
  const error = ref<unknown>(null)
  const view = ref<BoardViewResult>(BOARD_VIEW_RESULT)

  // 게시글 본문 내용 가져오기
  async function fetchView(id: string, postUid: number): Promise<void> {
    if (pending.value) return
    try {
      pending.value = true

      const { data, error } = await fetchGet<Resp<BoardViewResult>>(
        `board-${id}-${postUid}`,
        "/board/view",
        {
          id,
          postUid,
          latestLimit: latestLimit.value,
        },
      )

      if (!data.value || !data.value.success) {
        throw new Error(String(error.value ?? "fetchGet(/board/view) failed"))
      }

      view.value = data.value.result
    } catch (err) {
      error.value = err
    } finally {
      pending.value = false
    }
  }

  return {
    latestLimit,
    pending,
    error,
    view,

    fetchView,
  }
})
