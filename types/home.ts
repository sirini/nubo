import {
  type Board,
  type BoardConfig,
  type BoardListItem,
  type Search,
  BOARD,
  BOARD_CONFIG,
  BOARD_LIST_ITEM,
} from "~/types/board"

export type HomeLang = 0 | 1 | 2
export type HomeNotice = 0 | 1 | 2 | 3 | 4

// 최근 게시글들 최종 리턴 타입 정의
export type BoardHomePostItem = BoardListItem & {
  id: string
  type: Board
  useCategory: boolean
}

// 최근 게시글들 최종 리턴 타입 및 게시판 정보 정의
export type BoardHomePostResult = {
  items: BoardHomePostItem[]
  config: BoardConfig
}

// 최근 게시글들 최종 리턴 기본값
export const BOARD_HOME_POST_ITEM: BoardHomePostItem = {
  ...BOARD_LIST_ITEM,
  id: "",
  type: BOARD.DEFAULT as Board,
  useCategory: false,
}

// 최근 게시글들 최종 리턴 및 게시판 정보 기본값
export const BOARD_HOME_POST_RESULT: BoardHomePostResult = {
  items: [] as BoardHomePostItem[],
  config: BOARD_CONFIG,
}

// 홈 사이드바에 출력할 게시판 목록 형태 정의
export type HomeSidebarBoardResult = {
  id: string
  type: Board
  name: string
  info: string
}

// 홈 사이드바에 출력할 그룹 목록 형태 정의
export type HomeSidebarGroupResult = {
  group: string
  boards: HomeSidebarBoardResult[]
}

// 홈화면 최근 게시글들 가져오는 파라미터 정의
export type FetchHomeLatestPostsParams = {
  sinceUid?: number
  bunch?: number
  option?: Search
  keyword?: string
  [key: string]: string | number | boolean | object | undefined
}
