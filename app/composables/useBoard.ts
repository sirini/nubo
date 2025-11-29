import { useAsyncGet } from "~/lib/utils"
import type { BoardViewResult } from "~/types/board"
import type { Resp } from "~/types/common"

export const useBoard = () => {
  // 게시글 본문 내용 가져오기
  const fetchBoardView = async (id: string, postUid: number, latestLimit: number = 5) => {
    return useAsyncGet<Resp<BoardViewResult>>(`board-${id}-${postUid}`, "/board/view", {
      id,
      postUid,
      latestLimit,
    })
  }

  return {
    fetchBoardView,
  }
}
