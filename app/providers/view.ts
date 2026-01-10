import { toast } from "vue-sonner"
import type { NuboViewContext } from "~/types/nubo-skin-keys"

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
    isLoggedIn: computed(() => auth.isLoggedIn),
    isWriter: computed(() => auth.user.uid === board.view.post.writer.uid),
    content: computed({ get: () => editor.content, set: (val: string) => (editor.content = val) }),
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
    removeComment: async () => {
      await comment.removeComment({
        boardUid: board.view.config.uid,
        userUid: auth.user.uid,
        removeTargetUid: comment.target.remove,
      })
    },
    setModifyComment: (commentUid: number, content: string) => {
      comment.target.modify = commentUid
      editor.content = content
      toast(`👉 기존 댓글을 작성란으로 가져왔습니다`)
    },
    setReplyComment: (commentUid: number, content: string) => {
      comment.target.reply = commentUid
      editor.content = `<blockquote>${content}</blockquote><p>&nbsp;</p>`
      toast(`👉 답글을 남길 댓글을 작성란으로 가져왔습니다`)
    },
    writeNewComment: async () => {
      await comment.writeComment(
        {
          boardUid: board.view.config.uid,
          postUid,
          userUid: auth.user.uid,
          content: editor.content,
        },
        auth.user,
      )
      editor.content = ""
    },
    writeReplyComment: async () => {
      await comment.replyComment(
        {
          boardUid: board.view.config.uid,
          postUid,
          userUid: auth.user.uid,
          content: editor.content,
          replyTargetUid: comment.target.reply,
        },
        auth.user,
      )
      editor.content = ""
    },
    modifyExistComment: async () => {
      await comment.modifyComment({
        boardUid: board.view.config.uid,
        postUid,
        userUid: auth.user.uid,
        content: editor.content,
        modifyTargetUid: comment.target.modify,
      })
      editor.content = ""
    },
    downloadFile: async (fileUid: number) => {
      await board.downloadFile(fileUid)
    },
    likePost: async (isLiked: boolean) => {
      await board.likePost(isLiked)
    },
    makeTableOfContents: () => board.makeTableOfContents(),
    updateReadingProgress: (element: string) => board.updateReadingProgress(element),
  }
}
