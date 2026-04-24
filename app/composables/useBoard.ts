import { reqPatch } from "~/composables/useUtils"
import type {
  BoardListParam,
  BoardListResult,
  BoardViewDownloadResult,
  BoardViewLikeParam,
  BoardViewParam,
  BoardViewResult,
  BoardWriterLatestContent,
} from "~/types/board"
import type { Resp } from "~/types/common"

export const useBoard = () => {
  const config = useRuntimeConfig()

  // 첨부파일 다운로드 하기
  const download = async (boardUid: number, fileUid: number) => {
    return await reqGet<Resp<BoardViewDownloadResult>>("/board/download", {
      boardUid,
      fileUid,
    })
  }

  // 게시글 본문 내용 가져오기
  const loadInitBoardView = async (params: BoardViewParam) => {
    return await reqGet<Resp<BoardViewResult>>("/board/view", params)
  }

  // 게시글 목록 가져오기
  const loadInitBoardList = async (params: BoardListParam) => {
    return await reqGet<Resp<BoardListResult>>("/board/list", params)
  }

  // 특정 회원의 최근 (댓)글들 가져오기
  const loadInitUserLatestContent = async (targetUserUid: number, limit: number = 5) => {
    return await reqGet<Resp<BoardWriterLatestContent>>("/board/user/latest", {
      targetUserUid,
      limit,
    })
  }

  // 게시글에 좋아요 남기기 (혹은 취소하기)
  const like = async (param: BoardViewLikeParam) => {
    return await reqPatch<Resp<null>>("/board/like", param)
  }

  return {
    download,
    loadInitBoardView,
    loadInitBoardList,
    loadInitUserLatestContent,
    like,
  }
}
