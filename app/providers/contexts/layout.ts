import type { HomeSidebarGroupResult } from "~/types/home"
import type { UserMyResult } from "~/types/user"

// [레이아웃] 화면에서 필요한 변수 & 함수들 정의
export interface NuboLayoutContext {
  isAdmin: ComputedRef<boolean>
  isLoggedIn: ComputedRef<boolean>
  user: ComputedRef<UserMyResult>
  menus: ComputedRef<HomeSidebarGroupResult[]>
  searchOptions: ComputedRef<{ label: string; value: number }[]>
  searchOption: WritableComputedRef<number>
  searchKeyword: WritableComputedRef<string>
  search: (event: Event) => void
  moveTop: () => void
}

export const nuboLayoutKey: InjectionKey<NuboLayoutContext> = Symbol("nuboLayoutContext")

// [레이아웃] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboLayoutContext = () => {
  const context = inject(nuboLayoutKey)
  if (!context) {
    throw new Error("useNuboLayoutContext must be used within a proper provider")
  }
  return context
}
