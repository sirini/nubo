import { useSsrGet } from "~/lib/utils"
import type { BoardViewLikeParameter, BoardViewResult } from "~/types/board"
import type { Resp } from "~/types/common"

export const useBoard = () => {
  // 게시글 본문 내용 가져오기
  const loadInitBoardView = async (id: string, postUid: number, latestLimit: number = 5) => {
    return useSsrGet<Resp<BoardViewResult>>(`board-${id}-${postUid}`, "/board/view", {
      id,
      postUid,
      latestLimit,
    })
  }

  // 게시글에 좋아요 남기기 (혹은 취소하기)
  const likePost = async (param: BoardViewLikeParameter) => {
    const { $api } = useNuxtApp()
    return await $api<Resp<null>>("/board/like", {
      method: "PATCH",
      body: param,
    })
  }

  return {
    loadInitBoardView,
    likePost,
  }
}
