import { defineStore } from "pinia"
import { toast } from "vue-sonner"
import { BOARD_VIEW_RESULT, type BoardViewResult } from "~/types/board"

export const useBoardStore = defineStore("board", () => {
  const { loadInitBoardView, likePost } = useBoard()
  const error = ref<unknown>(null)
  const isFileListOpen = ref<boolean>(false)
  const latestLimit = ref<number>(5)
  const pending = ref<boolean>(false)
  const view = ref<BoardViewResult>(BOARD_VIEW_RESULT)

  // 게시글 본문 내용 가져오기
  const getInitView = async (id: string, postUid: number) => {
    if (pending.value) return
    try {
      pending.value = true
      const response = await loadInitBoardView(id, postUid)

      if (!response.success || !response.result) {
        return
      }
      view.value = response.result
    } finally {
      pending.value = false
    }
  }

  // 게시글에 대한 좋아요 상태 변경하기
  const togglePostLike = async (isLiked: boolean) => {
    try {
      const response = await likePost({
        boardUid: view.value.config.uid,
        postUid: view.value.post.uid,
        userUid: 0 /* not used */,
        liked: isLiked,
      })

      if (!response.success) {
        toast(`좋아요 상태를 변경하지 못했습니다: ${response.error}`)
        return
      }
      if (isLiked) {
        toast(`이 게시글에 좋아요를 남겼습니다 😍`)
      }
    } catch (e) {
      toast(`좋아요 상태를 변경하지 못했습니다: ${e}`)
    }
  }

  return {
    error,
    isFileListOpen,
    latestLimit,
    pending,
    view,

    getInitView,
    togglePostLike,
  }
})
