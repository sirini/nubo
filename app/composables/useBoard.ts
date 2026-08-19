import type {
  BoardItem,
  BoardListParam,
  BoardListResult,
  BoardViewDownloadResult,
  BoardViewLikeParam,
  BoardMovePostParam,
  BoardViewParam,
  BoardViewResult,
  BoardWriterLatestContent,
  RemovePostParam,
} from "~/types/board"
import type { Resp } from "~/types/common"
import type { TradeListResult, TradeViewResult } from "~/types/trade"

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
    const { data } = await useFetch<Resp<BoardViewResult | TradeViewResult>>("/board/view", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
    return data.value
  }

  // 게시글 목록 가져오기
  const loadInitBoardList = async (param: BoardListParam) => {
    const { data } = await useFetch<Resp<BoardListResult | TradeListResult>>("/board/list", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
    })
    return data.value
  }

  // 특정 회원의 최근 (댓)글들 가져오기
  const loadInitUserLatestContent = async (targetUserUid: number, limit: number = 5) => {
    const { data } = await useFetch<Resp<BoardWriterLatestContent>>("/board/user/latest", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: {
        targetUserUid,
        limit,
      },
    })
    return data.value
  }

  // 게시글에 좋아요 남기기 (혹은 취소하기)
  const like = async (param: BoardViewLikeParam) => {
    return await $fetch<Resp<null>>("/board/like", {
      baseURL: config.public.apiBase,
      method: "PATCH",
      body: param,
    })
  }

  // 게시글 삭제하기
  const removePost = async (param: RemovePostParam) => {
    return await $fetch<Resp<null>>("/board/remove/post", {
      baseURL: config.public.apiBase,
      method: "DELETE",
      body: param,
    })
  }

  // 게시글을 이동할 수 있는 게시판 목록 가져오기
  const loadMoveTargets = async (boardUid: number) => {
    return await $fetch<Resp<BoardItem[]>>("/board/move/list", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { boardUid },
    })
  }

  // 게시글 이동하기
  const movePost = async (param: BoardMovePostParam) => {
    const body = new URLSearchParams({
      boardUid: param.boardUid.toString(),
      targetBoardUid: param.targetBoardUid.toString(),
      postUid: param.postUid.toString(),
    })
    return await $fetch<Resp<null>>("/board/move/apply", {
      baseURL: config.public.apiBase,
      method: "POST",
      body,
    })
  }

  return {
    download,
    loadInitBoardView,
    loadInitBoardList,
    loadInitUserLatestContent,
    like,
    loadMoveTargets,
    movePost,
    removePost,
  }
}
