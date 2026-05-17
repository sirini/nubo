import type {
  CommentLikeParam,
  CommentListParam,
  CommentListResult,
  CommentModifyParam,
  CommentRemoveParam,
  CommentReplyParam,
  CommentWriteParam,
} from "~/types/comment"
import type { Resp } from "~/types/common"

export const useComment = () => {
  const config = useRuntimeConfig()

  // 댓글 목록 가져오기
  const loadInitCommentList = async (param: CommentListParam) => {
    const { data } = await useFetch<Resp<CommentListResult>>("/comment/list", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
    return data.value
  }

  // 댓글에 좋아요 남기기
  const like = async (param: CommentLikeParam) => {
    return await $fetch<Resp<null>>("/comment/like", {
      baseURL: config.public.apiBase,
      method: "PATCH",
      body: param,
    })
  }

  // 댓글 수정하기
  const modify = async (param: CommentModifyParam) => {
    return await $fetch<Resp<null>>("/comment/modify", {
      baseURL: config.public.apiBase,
      method: "PATCH",
      body: param,
    })
  }

  // 댓글 삭제하기
  const remove = async (param: CommentRemoveParam) => {
    return await $fetch<Resp<null>>("/comment/remove", {
      baseURL: config.public.apiBase,
      method: "DELETE",
      query: param,
    })
  }

  // 댓글에 답글 남기기
  const reply = async (param: CommentReplyParam) => {
    return await $fetch<Resp<number>>("/comment/reply", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: param,
    })
  }

  // 댓글 작성하기
  const write = async (param: CommentWriteParam) => {
    return await $fetch<Resp<number>>("/comment/write", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: param,
    })
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
