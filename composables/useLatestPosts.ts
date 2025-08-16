import { SEARCH, type Search } from "~/types/board"
import type { Resp } from "~/types/common"
import type { BoardHomePostItem } from "~/types/home"

export async function useLatestPosts() {
  const { $api } = useNuxtApp()
  const params = reactive({
    sinceUid: 0,
    bunch: 20,
    option: SEARCH.TITLE as Search,
    keyword: "",
  })
  const posts = ref<BoardHomePostItem[]>([])
  const pending = ref<boolean>(false)
  const error = ref<unknown>(null)

  // 출력되는 기본값 정의
  const defaultResp: Resp<BoardHomePostItem[]> = {
    success: false,
    error: "init value",
    code: 0,
    result: [],
  }

  // SSR 포함 최초 로드
  const {
    data,
    pending: p,
    error: e,
    refresh,
    execute,
  } = await useAsyncData(
    "home-latest",
    () => $api<Resp<BoardHomePostItem[]>>("/home/latest", { method: "GET", params }),
    {
      server: true,
      immediate: true,
      watch: [() => params.option, () => params.keyword],
      default: () => defaultResp,
    },
  )

  // 최초 / 필터 변경 시 결과 덮어쓰기
  watchEffect(() => {
    pending.value = p.value
    error.value = e.value
    const d = data.value
    if (!d || !d.success) return

    if (params.sinceUid === 0) {
      posts.value = d.result ?? []
    } else {
      const merged = [
        ...new Map([...posts.value, ...(d.result ?? [])].map((item) => [item.uid, item])).values(),
      ]
      posts.value = merged
    }
    params.sinceUid = posts.value.at(-1)?.uid ?? 0
  })

  // 게시글 더 가져오기
  async function loadMore() {
    if (pending.value) return
    await execute()
  }

  // 필터/검색 바꿀 때는 목록 초기화 후 새로 로드
  function setFilter({ option, keyword }: { option?: Search; keyword?: string }) {
    if (option !== undefined) params.option = option
    if (keyword !== undefined) params.keyword = keyword

    params.sinceUid = 0
    posts.value = []
    refresh()
  }

  return {
    posts,
    pending,
    error,
    params,

    loadMore,
    setFilter,
  }
}
