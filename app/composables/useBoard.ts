import { reqPatch } from "~/composables/useUtils"
import type { BoardViewLikeParameter, BoardViewResult } from "~/types/board"
import type { Resp } from "~/types/common"

export const useBoard = () => {
  const config = useRuntimeConfig()

  // 게시글 본문 내용 가져오기
  const loadInitBoardView = async (id: string, postUid: number, latestLimit: number = 5) => {
    return await useFetch<Resp<BoardViewResult>>("/board/view", {
      baseURL: config.public.apiBase,
      method: "GET",
      params: {
        id,
        postUid,
        latestLimit,
      },
    })
  }

  // 게시글에 좋아요 남기기 (혹은 취소하기)
  const likePost = async (param: BoardViewLikeParameter) => {
    return reqPatch("/board/like", param)
  }

  return {
    loadInitBoardView,
    likePost,
  }
}
