import { defineStore } from "pinia"
import { SEARCH, type Search } from "~/types/board"
import type { HomePostItem } from "~/types/home"

export const useHomeStore = defineStore("home", () => {
  const { fetchHomeLatestPosts } = useHome()
  const bunch = ref<number>(20)
  const error = ref<unknown>(null)
  const initialized = ref<boolean>(false)
  const keyword = ref<string>("")
  const option = ref<Search>(SEARCH.TITLE as Search)
  const pending = ref<boolean>(false)
  const posts = ref<HomePostItem[]>([])
  const sinceUid = ref<number>(0)

  // 내부 유틸: 결과 병합
  const mergePosts = (incoming: HomePostItem[] = []) => {
    if (sinceUid.value === 0) {
      posts.value = incoming
      return
    }
    const map = new Map<number, HomePostItem>(posts.value.map((i) => [i.uid, i]))
    for (const it of incoming) map.set(it.uid, it)
    const merged = Array.from(map.values())

    if (merged.length === posts.value.length && merged.at(-1)?.uid === posts.value.at(-1)?.uid)
      return
    posts.value = merged
  }

  // 목록 조회 (초기/검색/더보기 공용)
  const fetchLatest = async (opts?: { reset?: boolean }) => {
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
  const loadMore = async () => {
    if (pending.value) return
    const last = posts.value.at(-1)?.uid ?? 0
    if (last === sinceUid.value) return
    sinceUid.value = last
    await fetchLatest()
  }

  // 각종 변수 초기화
  const reset = () => {
    sinceUid.value = 0
    posts.value = []
    pending.value = false
    error.value = null
    initialized.value = false
  }

  return {
    bunch,
    error,
    initialized,
    keyword,
    option,
    pending,
    posts,
    sinceUid,

    fetchLatest,
    loadMore,
    reset,
  }
})
