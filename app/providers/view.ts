import { toast } from "vue-sonner"
import type { NuboViewContext } from "./contexts/view"

export const useViewProvider = (): NuboViewContext => {
  const route = useRoute()
  const auth = useAuthStore()
  const board = useBoardStore()
  const editor = useEditorStore()
  const comment = useCommentStore()
  const postUid = parseInt(route.params.postUid as string, 10)

  return {
    view: computed(() => board.view),
    config: computed(() => board.view.config),
    comments: computed(() => comment.comments),
    isConfirmRemoveCommentDialog: computed({
      get: () => comment.isConfirmDialog,
      set: (val) => (comment.isConfirmDialog = val),
    }),
    isConfirmRemovePostDialog: computed({
      get: () => board.isConfirmDialog,
      set: (val) => (board.isConfirmDialog = val),
    }),
    isMovePostDialog: computed({
      get: () => board.isMovePostDialog,
      set: (val) => {
        if (!board.isMovingPost || val) board.isMovePostDialog = val
      },
    }),
    isLoadingMoveTargets: computed(() => board.isLoadingMoveTargets),
    isMovingPost: computed(() => board.isMovingPost),
    moveTargets: computed(() => board.moveTargets),
    moveTargetUid: computed({
      get: () => board.moveTargetUid,
      set: (val: number) => (board.moveTargetUid = val),
    }),
    isAdmin: computed(() => board.view.isAdmin),
    isLoggedIn: computed(() => auth.isLoggedIn),
    isWriter: computed(() => auth.user.uid === board.view.post.writer.uid),
    imgIdx: computed({
      get: () => board.imgIdx,
      set: (val: number) => (board.imgIdx = val),
    }),
    content: computed(() => editor.content),
    commentTarget: computed(() => comment.target),
    checkPermissionComment: (writerUid: number) => {
      if (auth.user.uid === 1) {
        return true
      }
      if (writerUid === auth.user.uid) {
        return true
      }
      return false
    },
    likeComment: async (commentUid: number, liked: boolean) => {
      await comment.likeComment({
        boardUid: board.view.config.uid,
        commentUid,
        liked,
        userUid: auth.user.uid,
      })
    },
    confirmRemoveComment: (commentUid: number) => {
      comment.target.remove = commentUid
      comment.isConfirmDialog = true
    },
    confirmRemovePost: (postUid: number) => {
      board.removeTargetUid = postUid
      board.isConfirmDialog = true
    },
    openMovePostDialog: () => board.openMovePostDialog(),
    removeComment: async () => {
      const removed = await comment.removeComment({
        boardUid: board.view.config.uid,
        userUid: auth.user.uid,
        removeTargetUid: comment.target.remove,
      })
      if (removed && board.view.post.comment > 0) board.view.post.comment--
      return removed
    },
    setModifyComment: (commentUid: number, content: string) => {
      comment.target.reply = 0
      comment.target.modify = commentUid
      editor.content = content
      toast(`👉 기존 댓글을 작성란으로 가져왔습니다`)
    },
    setReplyComment: (commentUid: number, content: string) => {
      comment.target.modify = 0
      comment.target.reply = commentUid
      editor.content = `<blockquote>${content}</blockquote><p>&nbsp;</p>`
      toast(`👉 답글을 남길 댓글을 작성란으로 가져왔습니다`)
    },
    cancelCommentTarget: () => {
      comment.target.reply = 0
      comment.target.modify = 0
      editor.content = ""
    },
    writeNewComment: async () => {
      const written = await comment.writeComment(
        {
          boardUid: board.view.config.uid,
          postUid,
          userUid: auth.user.uid,
          content: editor.content,
        },
        auth.user,
      )
      if (written) {
        editor.content = ""
        board.view.post.comment++
      }
      return written
    },
    writeReplyComment: async () => {
      const written = await comment.replyComment(
        {
          boardUid: board.view.config.uid,
          postUid,
          userUid: auth.user.uid,
          content: editor.content,
          replyTargetUid: comment.target.reply,
        },
        auth.user,
      )
      if (written) {
        editor.content = ""
        board.view.post.comment++
      }
      return written
    },
    modifyExistComment: async () => {
      const modified = await comment.modifyComment({
        boardUid: board.view.config.uid,
        postUid,
        userUid: auth.user.uid,
        content: editor.content,
        modifyTargetUid: comment.target.modify,
      })
      if (modified) editor.content = ""
      return modified
    },
    downloadFile: async (fileUid: number) => {
      await board.downloadFile(fileUid)
    },
    originalImageUrl: async (fileUid: number) => board.originalImageUrl(fileUid),
    likePost: async (isLiked: boolean) => {
      await board.likePost(isLiked)
    },
    makeTableOfContents: () => board.makeTableOfContents(),
    updateReadingProgress: (element: string) => board.updateReadingProgress(element),
    clearReadingProgress: () => board.clearReadingProgress(),
    remove: (boardUid: number, postUid: number) => board.remove(boardUid, postUid),
    move: () => board.move(),
  }
}
