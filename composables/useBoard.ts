import { type BoardViewResult } from "~/types/board"
import { type Resp } from "~/types/common"

export const useBoard = () => {
  // 게시글 본문 내용 가져오기
  const fetchBoardView = async (id: string, postUid: number, latestLimit: number = 5) => {
    const { $api } = useNuxtApp()

    return useAsyncData(
      `board-${id}-${postUid}`,
      () =>
        $api<Resp<BoardViewResult>>("/board/view", {
          method: "GET",
          params: {
            id,
            postUid,
            latestLimit,
          },
        }),
      {
        server: true,
        immediate: true,
      },
    )
  }

  return {
    fetchBoardView,
  }
}
