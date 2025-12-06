import { toast } from "vue-sonner"
import type { BoardViewResult } from "~/types/board"
import type { CommentResult } from "~/types/comment"

export const useCommentStore = defineStore("comment", () => {
  const { loadInitCommentList } = useComment()
  const comments = ref<CommentResult[]>([])
  const pending = ref<boolean>(false)
  const totalCommentCount = ref<number>(0)
  const view = ref<BoardViewResult | null>(null)

  // 댓글 목록 가져오기
  const getInitComments = async (page: number, viewResult: BoardViewResult) => {
    view.value = viewResult
    if (pending.value || !view.value) return
    try {
      pending.value = true
      const response = await loadInitCommentList({
        boardUid: view.value.config.uid,
        postUid: view.value.post.uid,
        userUid: 0 /* not used */,
        page,
        limit: view.value.config.rowCount,
      })
      if (!response.success || !response.result) {
        toast(`댓글 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      comments.value = response.result.comments
      totalCommentCount.value = response.result.totalCommentCount
    } catch (e) {
      toast(`댓글 목록을 가져오지 못했습니다: ${e}`)
    } finally {
      pending.value = false
    }
  }

  return {
    comments,
    totalCommentCount,

    getInitComments,
  }
})
