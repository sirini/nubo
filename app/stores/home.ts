import { defineStore } from "pinia"
import { SEARCH, type Search } from "~/types/board"
import type { BoardHomePostItem } from "~/types/home"

const { fetchHomeLatestPosts } = useHome()

export const useHomeStore = defineStore("home", () => {
  const sinceUid = ref<number>(0)
  const bunch = ref<number>(20)
  const option = ref<Search>(SEARCH.TITLE as Search)
  const keyword = ref<string>("")
  const posts = ref<BoardHomePostItem[]>([])
  const pending = ref<boolean>(false)
  const error = ref<unknown>(null)
  const initialized = ref<boolean>(false)
  const openMenus = ref<Record<string, boolean>>({})
  const timers = ref<Record<string, NodeJS.Timeout>>({})

  // 내부 유틸: 결과 병합
  function mergePosts(incoming: BoardHomePostItem[] = []) {
    if (sinceUid.value === 0) {
      posts.value = incoming
      return
    }
    const map = new Map<number, BoardHomePostItem>(posts.value.map((i) => [i.uid, i]))
    for (const it of incoming) map.set(it.uid, it)
    const merged = Array.from(map.values())

    if (merged.length === posts.value.length && merged.at(-1)?.uid === posts.value.at(-1)?.uid)
      return
    posts.value = merged
  }

  // 목록 조회 (초기/검색/더보기 공용)
  async function fetchLatest(opts?: { reset?: boolean }) {
    if (pending.value) return
    try {
      pending.value = true
      if (opts?.reset) {
        sinceUid.value = 0
        posts.value = []
      }

      const { data } = await fetchHomeLatestPosts({
        sinceUid: sinceUid.value,
        bunch: bunch.value,
        option: option.value,
        keyword: keyword.value,
      })

      if (!data.value || !data.value.success) {
        return
      }

      mergePosts(data.value.result ?? [])
      initialized.value = true
    } finally {
      pending.value = false
    }
  }

  // 이전 게시글 더 가져오기
  async function loadMore() {
    if (pending.value) return
    const last = posts.value.at(-1)?.uid ?? 0
    if (last === sinceUid.value) return
    sinceUid.value = last
    await fetchLatest()
  }

  // 검색/필터 설정
  async function setFilter(newOption: Search, newKeyword: string) {
    const changed = option.value !== newOption || keyword.value !== newKeyword
    option.value = newOption
    keyword.value = newKeyword
    if (!changed) return
    await fetchLatest({ reset: true })
  }

  // 각종 변수 초기화
  function reset() {
    sinceUid.value = 0
    posts.value = []
    pending.value = false
    error.value = null
    initialized.value = false
  }

  // 상단 메뉴에 마우스 포인터가 들어갔을 때 호출
  function handleMenuEnter(group: string): void {
    if (timers.value[group]) {
      clearTimeout(timers.value[group])
    }
    openMenus.value[group] = true
  }

  // 상단 메뉴에 마우스 포인터가 나갔을 때 호출
  function handleMenuLeave(group: string): void {
    timers.value[group] = setTimeout(() => {
      openMenus.value[group] = false
    }, 200)
  }

  return {
    sinceUid,
    bunch,
    option,
    keyword,
    posts,
    pending,
    error,
    initialized,
    openMenus,

    fetchLatest,
    loadMore,
    setFilter,
    reset,
    handleMenuEnter,
    handleMenuLeave,
  }
})
