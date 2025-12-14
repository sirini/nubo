import type {
  CommentListResult,
  CommentListParam,
  CommentWriteParam,
  CommentModifyParam,
  CommentRemoveParam,
  CommentReplyParam,
  CommentLikeParam,
} from "~/types/comment"
import type { Resp } from "~/types/common"

export const useComment = () => {
  const config = useRuntimeConfig()

  // 댓글 목록 가져오기
  const loadInitCommentList = async (params: CommentListParam) => {
    const { data } = await useFetch<Resp<CommentListResult>>("/comment/list", {
      baseURL: config.public.apiBase,
      method: "GET",
      params,
    })
    return resp(data.value)
  }

  // 댓글에 좋아요 남기기
  const like = async (param: CommentLikeParam) => {
    return await reqPatch<Resp<null>>("/comment/like", param)
  }

  // 댓글 수정하기
  const modify = async (param: CommentModifyParam) => {
    return await reqPatch<Resp<null>>("/comment/modify", param)
  }

  // 댓글 삭제하기
  const remove = async (param: CommentRemoveParam) => {
    return await reqDelete<Resp<null>>("/comment/remove", param)
  }

  // 댓글에 답글 남기기
  const reply = async (param: CommentReplyParam) => {
    return await reqPost<Resp<number>>("/comment/reply", param)
  }

  // 댓글 작성하기
  const write = async (param: CommentWriteParam) => {
    return await reqPost<Resp<number>>("/comment/write", param)
  }

  return {
    loadInitCommentList,
    like,
    modify,
    remove,
    reply,
    write,
  }
}
