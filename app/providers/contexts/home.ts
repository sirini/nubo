import type { Search } from "~/types/board"
import type { HomePostItem, HomePostResult } from "~/types/home"

// [홈] 화면에서 필요한 변수 & 함수들 정의
export interface NuboHomeContext {
  isLanding: WritableComputedRef<boolean>
  isLastPost: ComputedRef<boolean>
  posts: ComputedRef<HomePostItem[]>
  option: ComputedRef<Search>
  optionLabels: ComputedRef<Record<number, string>>
  keyword: ComputedRef<string>
  loadMorePosts: () => Promise<void>
  getPostsById: (id: string, limit: number) => Promise<HomePostResult>
}

export const nuboHomeKey: InjectionKey<NuboHomeContext> = Symbol("nuboHomeContext")

// [홈] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboHomeContext = () => {
  const context = inject(nuboHomeKey)
  if (!context) {
    throw new Error("useNuboHomeContext must be used within a proper provider")
  }
  return context
}
