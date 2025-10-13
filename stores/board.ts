import { defineStore } from "pinia"
import { BOARD_VIEW_RESULT, type BoardViewResult } from "~/types/board"

export const useBoardStore = defineStore("board", () => {
  const latestLimit = ref<number>(5)
  const pending = ref<boolean>(false)
  const error = ref<unknown>(null)
  const view = ref<BoardViewResult>(BOARD_VIEW_RESULT)
  const { fetchBoardView } = useBoard()

  // 게시글 본문 내용 가져오기
  async function fetchView(id: string, postUid: number): Promise<void> {
    if (pending.value) return
    try {
      pending.value = true
      const { data, error } = await fetchBoardView(id, postUid)

      if (!data.value || !data.value.success) {
        return
      }
      view.value = data.value.result
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
