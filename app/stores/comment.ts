import { toast } from "vue-sonner"
import type { BoardViewResult } from "~/types/board"
import {
  COMMENT_RESULT,
  type CommentLikeParam,
  type CommentModifyParam,
  type CommentRemoveParam,
  type CommentReplyParam,
  type CommentResult,
  type CommentWriteParam,
} from "~/types/comment"
import type { UserMyResult } from "~/types/user"
import { likeCountAfterTransition } from "~/utils/like"

export const useCommentStore = defineStore("comment", () => {
  const { loadInitCommentList, write, reply, remove, modify, like } = useComment()
  const comments = ref<CommentResult[]>([])
  const isLoading = ref<boolean>(false)
  const isConfirmDialog = ref<boolean>(false)
  const page = ref<number>(1)
  const totalCommentCount = ref<number>(0)
  const limit = ref<number>(20)
  const view = ref<BoardViewResult | null>(null)
  const target = ref({ reply: 0, remove: 0, modify: 0 })
  const pendingLikes = new Set<number>()

  // 변수들 초기화하기
  const clear = () => {
    isLoading.value = false
    page.value = 1
    isLoading.value = false
    target.value = { reply: 0, remove: 0, modify: 0 }
  }

  // 댓글 목록 가져오기
  const getInitComments = async (viewResult: BoardViewResult) => {
    view.value = viewResult
    if (isLoading.value || !view.value) return
    try {
      isLoading.value = true
      const response = await loadInitCommentList({
        boardUid: view.value.config.uid,
        postUid: view.value.post.uid,
        userUid: 0 /* not used */,
        page: page.value,
        limit: limit.value,
      })
      if (!response || !response.success || !response.result) {
        toast(`❌ 댓글 목록을 가져오지 못했습니다: ${response?.error}`)
        return
      }
      comments.value = response.result.comments
      totalCommentCount.value = response.result.totalCommentCount

      comments.value.map((comment) => {
        comment.writer.name = recoverChars(comment.writer.name)
      })
    } catch (e) {
      toast(`❌ 댓글 목록을 가져오지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  }

  // 댓글에 좋아요 남기기
  const likeComment = async (param: CommentLikeParam) => {
    const current = comments.value.find((comment) => comment.uid === param.commentUid)
    if (!current || current.liked === param.liked || pendingLikes.has(param.commentUid)) return

    try {
      pendingLikes.add(param.commentUid)
      const response = await like(param)
      if (!response.success) {
        toast(`❌ 댓글에 좋아요를 남기지 못했습니다: ${response.error}`)
        return
      }

      const latest = comments.value.find((comment) => comment.uid === param.commentUid)
      if (latest && latest.liked !== param.liked) {
        latest.like = likeCountAfterTransition(latest.like, latest.liked, param.liked)
        latest.liked = param.liked
      }
    } catch (e) {
      toast(`❌ 댓글에 좋아요를 남기지 못했습니다: ${e}`)
    } finally {
      pendingLikes.delete(param.commentUid)
    }
  }

  // 댓글 수정하기
  const modifyComment = async (param: CommentModifyParam) => {
    try {
      const response = await modify(param)
      if (!response.success) {
        toast(`❌ 댓글을 수정하지 못했습니다: ${response.error}`)
        return false
      }

      const target = comments.value.find((c) => c.uid === param.modifyTargetUid)
      if (target) {
        target.content = param.content
      }
      toast(`✅ 댓글을 성공적으로 수정하였습니다`)
      clear()
      return true
    } catch (e) {
      toast(`❌ 댓글을 수정하지 못했습니다: ${e}`)
      return false
    }
  }

  // 댓글 삭제하기
  const removeComment = async (param: CommentRemoveParam) => {
    try {
      const response = await remove(param)
      if (!response.success) {
        toast(`❌ 댓글을 삭제하지 못했습니다: ${response.error}`)
        return false
      }
      const target = comments.value.findIndex((c) => c.uid === param.removeTargetUid)
      if (target > -1) {
        const child = comments.value.find(
          (c) => c.uid !== c.replyUid && c.replyUid === param.removeTargetUid,
        )
        if (child) {
          const parent = comments.value.at(target)
          if (parent) {
            parent.content = "(deleted)"
          }
        } else {
          comments.value.splice(target, 1)
        }
      }
      toast(`✅ 댓글을 성공적으로 삭제하였습니다`)
      clear()
      return true
    } catch (e) {
      toast(`❌ 댓글을 삭제하지 못했습니다: ${e}`)
      return false
    }
  }

  // 답글 남기기
  const replyComment = async (param: CommentReplyParam, user: UserMyResult) => {
    try {
      const response = await reply(param)
      if (!response.success) {
        toast(`❌ 답글을 남기지 못했습니다: ${response.error}`)
        return false
      }
      const comment = { ...COMMENT_RESULT }
      comment.uid = response.result
      comment.replyUid = param.replyTargetUid
      comment.writer = { uid: user.uid, name: user.name, profile: user.profile }
      comment.content = param.content
      comment.postUid = param.postUid
      comment.submitted = Date.now()

      const target = comments.value.findIndex((c) => c.uid === param.replyTargetUid)
      if (target > -1) {
        comments.value.splice(target + 1, 0, comment)
      }
      toast(`✅ 답글을 성공적으로 추가하였습니다`)
      clear()
      return true
    } catch (e) {
      toast(`❌ 답글을 남기지 못했습니다: ${e}`)
      return false
    }
  }

  // 댓글 작성하기
  const writeComment = async (param: CommentWriteParam, user: UserMyResult) => {
    param.content = param.content.trim()
    if (param.content.length < 10) {
      toast(`⚠️ 댓글 내용이 너무 짧습니다: ${param}`)
      return false
    }

    try {
      isLoading.value = true
      const response = await write(param)
      if (!response.success) {
        toast(`❌ 댓글을 작성하지 못했습니다: ${response.error}`)
        return false
      }
      const comment = { ...COMMENT_RESULT }
      comment.uid = response.result
      comment.replyUid = response.result
      comment.writer = { uid: user.uid, name: recoverChars(user.name), profile: user.profile }
      comment.content = param.content
      comment.postUid = param.postUid
      comment.submitted = Date.now()
      comments.value.push(comment)

      toast(`✅ 댓글을 성공적으로 작성하였습니다`)
      clear()
      return true
    } catch (e) {
      toast(`❌ 댓글을 작성하지 못했습니다: ${e}`)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    comments,
    isLoading,
    isConfirmDialog,
    page,
    target,
    totalCommentCount,

    getInitComments,
    likeComment,
    modifyComment,
    removeComment,
    replyComment,
    writeComment,
  }
})
