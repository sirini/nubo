import { defineStore } from "pinia"
import { BOARD_VIEW_RESULT, type BoardViewResult } from "~/types/board"

export const useBoardStore = defineStore("board", () => {
  const { fetchBoardView } = useBoard()
  const error = ref<unknown>(null)
  const isFileListOpen = ref<boolean>(false)
  const latestLimit = ref<number>(5)
  const pending = ref<boolean>(false)
  const view = ref<BoardViewResult>(BOARD_VIEW_RESULT)

  // 게시글 본문 내용 가져오기
  const fetchView = async (id: string, postUid: number) => {
    if (pending.value) return
    try {
      pending.value = true
      const { data } = await fetchBoardView(id, postUid)

      if (!data.value || !data.value.success) {
        return
      }
      view.value = data.value.result
    } finally {
      pending.value = false
    }
  }

  return {
    error,
    isFileListOpen,
    latestLimit,
    pending,
    view,

    fetchView,
  }
})
