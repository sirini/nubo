import { SEARCH, type Search } from "~/types/board"
import type { Resp } from "~/types/common"
import type { BoardHomePostItem } from "~/types/home"

export async function useLatestPosts() {
  const { $api } = useNuxtApp()
  const sinceUid = useState("latest-posts-sinceUid", () => 0)
  const bunch = useState("latest-posts-bunch", () => 20)
  const option = useState("latest-posts-option", () => SEARCH.TITLE as Search)
  const keyword = useState("latest-posts-keyword", () => "")
  const posts = useState("latest-posts-data", () => [] as BoardHomePostItem[])
  const pending = useState("latest-posts-pending", () => false)
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
    () =>
      $api<Resp<BoardHomePostItem[]>>("/home/latest", {
        method: "GET",
        params: {
          sinceUid: sinceUid.value,
          bunch: bunch.value,
          option: option.value,
          keyword: keyword.value,
        },
      }),
    {
      server: true,
      immediate: true,
      default: () => defaultResp,
    },
  )

  watch(
    p,
    (v) => {
      pending.value = v
    },
    { immediate: true },
  )
  watch(
    e,
    (v) => {
      error.value = v
    },
    { immediate: true },
  )
  watch(
    data,
    (d) => {
      if (!d || !d.success) return
      const incoming = d.result ?? []

      if (sinceUid.value === 0) {
        const isSame =
          posts.value.length === incoming.length && posts.value.at(-1)?.uid === incoming.at(-1)?.uid
        if (!isSame) posts.value = incoming
        return
      }

      if (incoming.length === 0) return

      const map = new Map<number, BoardHomePostItem>()
      for (const it of posts.value) map.set(it.uid, it)
      for (const it of incoming) map.set(it.uid, it)

      const merged = Array.from(map.values())
      const isSameLength = merged.length === posts.value.length
      const isSameLast = merged.at(-1)?.uid === posts.value.at(-1)?.uid
      if (isSameLength && isSameLast) return

      posts.value = merged
    },
    { immediate: true },
  )

  // 게시글 더 가져오기
  async function loadMore() {
    if (p.value) return

    const last = posts.value.at(-1)?.uid ?? 0
    if (last === sinceUid.value) return

    sinceUid.value = last
    await execute()
  }

  // 필터/검색 바꿀 때는 목록 초기화 후 새로 로드
  function setFilter(_option: Search, _keyword: string) {
    const isChanged = option.value !== _option || keyword.value !== _keyword
    option.value = _option
    keyword.value = _keyword

    sinceUid.value = 0
    posts.value = []
    if (isChanged) refresh()
  }

  return {
    posts,
    pending,
    error,
    sinceUid,
    bunch,
    option,
    keyword,

    loadMore,
    setFilter,
  }
}
