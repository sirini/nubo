import type {
  BoardItem,
  BoardListParam,
  BoardListResult,
  BoardOriginalImageResult,
  BoardStudioParam,
  BoardStudioResult,
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
  const requestFetch = useRequestFetch()

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

  // 실제 업로드 경로 대신 권한 확인을 마친 원본 이미지 스트리밍 URL을 발급받는다.
  const originalImage = async (boardUid: number, fileUid: number) => {
    return await $fetch<Resp<BoardOriginalImageResult>>("/board/original", {
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

  // JWT 사용자가 선택한 게시판에 작성한 작품과 누적 성과 가져오기
  const loadMyStudio = async (param: BoardStudioParam) => {
    return await requestFetch<Resp<BoardStudioResult>>("/board/my/studio", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: param,
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
    originalImage,
    download,
    loadInitBoardView,
    loadInitBoardList,
    loadInitUserLatestContent,
    loadMyStudio,
    like,
    loadMoveTargets,
    movePost,
    removePost,
  }
}
