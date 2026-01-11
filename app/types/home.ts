import {
  type Board,
  BOARD,
  BOARD_CONFIG,
  BOARD_LIST_ITEM,
  type BoardConfig,
  type BoardListItem,
  SEARCH,
  type Search,
} from "~/types/board"

export type HomeLang = 0 | 1 | 2
export type HomeNotice = 0 | 1 | 2 | 3 | 4

// 최근 게시글들 최종 리턴 타입 정의
export type HomePostItem = BoardListItem & {
  id: string
  type: Board
  useCategory: boolean
}

// 최근 게시글들 최종 리턴 타입 및 게시판 정보 정의
export type HomePostResult = {
  items: HomePostItem[]
  config: BoardConfig
}

// 최근 게시글들 최종 리턴 기본값
export const BOARD_HOME_POST_ITEM: HomePostItem = {
  ...BOARD_LIST_ITEM,
  id: "",
  type: BOARD.DEFAULT as Board,
  useCategory: false,
}

// 최근 게시글들 최종 리턴 및 게시판 정보 기본값
export const BOARD_HOME_POST_RESULT: HomePostResult = {
  items: [] as HomePostItem[],
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
export type HomeLatestPostsParams = {
  sinceUid?: number
  bunch?: number
  option?: Search
  keyword?: string
  [key: string]: string | number | boolean | object | undefined
}

// 홈화면, 게시판에서 검색 옵션 정의
export const HomeSearchOptions = {
  title: SEARCH.TITLE,
  content: SEARCH.CONTENT,
  writer: SEARCH.WRITER,
  tag: SEARCH.TAG,
  imagedesc: SEARCH.IMAGEDESC,
}
