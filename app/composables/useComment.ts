import type { CommentListResult, CommentListParameter } from "~/types/comment"
import type { Resp } from "~/types/common"

export const useComment = () => {
  const config = useRuntimeConfig()

  // 댓글 목록 가져오기
  const loadInitCommentList = async (params: CommentListParameter) => {
    const { data } = await useFetch<Resp<CommentListResult>>("/comment/list", {
      baseURL: config.public.apiBase,
      method: "GET",
      params,
    })
    return resp(data.value)
  }

  return {
    loadInitCommentList,
  }
}
