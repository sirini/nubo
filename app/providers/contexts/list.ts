import type { BoardConfig, BoardListItem, Search } from "~/types/board"

// [게시판 글목록] 화면에서 필요한 변수 & 함수들 정의
export interface NuboListContext {
  notices: ComputedRef<BoardListItem[]>
  posts: ComputedRef<BoardListItem[]>
  userBlackList: ComputedRef<number[]>
  config: ComputedRef<BoardConfig>
  isAdmin: ComputedRef<boolean>
  isLoggedIn: ComputedRef<boolean>
  page: ComputedRef<number>
  totalPostCount: ComputedRef<number>
  option: WritableComputedRef<Search>
  keyword: WritableComputedRef<string>
  searchPost: () => void
  setPagingUrl: (targetUrl: number) => string
}

export const nuboListKey: InjectionKey<NuboListContext> = Symbol("nuboListContext")

// [게시판 글목록] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboListContext = () => {
  const context = inject(nuboListKey)
  if (!context) {
    throw new Error("useNuboListContext must be used within a proper provider")
  }
  return context
}
