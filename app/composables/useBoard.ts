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
    return await $fetch<Resp<BoardViewDownloadResult>>("/board/download", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: {
        boardUid,
        fileUid,
      },
    })
  }

  // 게시글 본문 내용 가져오기
  const loadInitBoardView = async (param: BoardViewParam) => {
    return await $fetch<Resp<BoardViewResult>>("/board/view", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
  }

  // 게시글 목록 가져오기
  const loadInitBoardList = async (param: BoardListParam) => {
    return await $fetch<Resp<BoardListResult>>("/board/list", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
  }

  // 특정 회원의 최근 (댓)글들 가져오기
  const loadInitUserLatestContent = async (targetUserUid: number, limit: number = 5) => {
    return await $fetch<Resp<BoardWriterLatestContent>>("/board/user/latest", {
      baseURL: config.public.apiBase,
      query: {
        targetUserUid,
        limit,
      },
    })
  }

  // 게시글에 좋아요 남기기 (혹은 취소하기)
  const like = async (param: BoardViewLikeParam) => {
    return await $fetch<Resp<null>>("/board/like", {
      baseURL: config.public.apiBase,
      method: "PATCH",
      body: param,
    })
  }

  return {
    download,
    loadInitBoardView,
    loadInitBoardList,
    loadInitUserLatestContent,
    like,
  }
}
