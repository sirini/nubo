import { defineStore } from "pinia"
import { toast } from "vue-sonner"
import {
  BOARD_LIST_RESULT,
  BOARD_VIEW_RESULT,
  SEARCH,
  type BoardListResult,
  type BoardViewResult,
  type Search,
} from "~/types/board"

export const useBoardStore = defineStore("board", () => {
  const { loadInitBoardView, loadInitBoardList, like, download } = useBoard()
  const config = useRuntimeConfig()
  const error = ref<unknown>(null)
  const latestLimit = ref<number>(5)
  const pending = ref<boolean>(false)
  const view = ref<BoardViewResult>(BOARD_VIEW_RESULT)
  const list = ref<BoardListResult>(BOARD_LIST_RESULT)
  const page = ref<number>(1)
  const option = ref<Search>(SEARCH.TITLE as Search)
  const options = ref<Record<string, number>>({
    title: SEARCH.TITLE,
    content: SEARCH.CONTENT,
    writer: SEARCH.WRITER,
    tag: SEARCH.TAG,
    imagedesc: SEARCH.IMAGEDESC,
  })
  const optionLabels = computed(() => {
    const labels: Record<number, string> = {}
    for (const [key, value] of Object.entries(options.value)) {
      labels[value] = key
    }
    return labels
  })
  const keyword = ref<string>("")

  // 게시글 본문 내용 가져오기
  const getInitView = async (id: string, postUid: number) => {
    if (pending.value) return
    try {
      pending.value = true
      const response = await loadInitBoardView(id, postUid)

      if (!response.success || !response.result) {
        toast(`❌ 게시글 내용을 가져오지 못했습니다: ${response.error}`)
        return
      }
      view.value = response.result
      view.value.post.writer.name = recoverChars(view.value.post.writer.name)
      view.value.post.writer.signature = recoverChars(view.value.post.writer.signature)
    } finally {
      pending.value = false
    }
  }

  // 게시글 목록 가져오기
  const getInitList = async (id: string) => {
    if (pending.value) return
    try {
      pending.value = true
      const response = await loadInitBoardList({
        id,
        option: option.value,
        keyword: keyword.value,
        page: page.value,
      })

      if (!response.success || !response.result) {
        toast(`❌ 게시글 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      response.result.notices.map((notice) => {
        notice.title = recoverChars(notice.title)
        notice.writer.name = recoverChars(notice.writer.name)
      })
      response.result.posts.map((post) => {
        post.title = recoverChars(post.title)
        post.writer.name = recoverChars(post.writer.name)
      })
      list.value = response.result
    } finally {
      pending.value = false
    }
  }

  // 첨부파일 다운로드하기
  const downloadFile = async (fileUid: number) => {
    try {
      const response = await download(view.value.config.uid, fileUid)
      if (!response.success || !response.result) {
        toast(`❌ 파일을 내려받지 못했습니다: ${response.error}`)
        return
      }
      const link = document.createElement("a")
      link.href = `${config.public.goapi}${response.result.path}`
      link.download = response.result.name
      link.target = "_blank"
      link.style.display = "none"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast(`✅ 브라우저 기본 다운로드 폴더를 새로고침 해보세요`)
    } catch (e) {
      toast(`❌ 파일을 내려받지 못했습니다: ${e}`)
    }
  }

  // 게시글에 좋아요 누르기
  const likePost = async (isLiked: boolean) => {
    try {
      const response = await like({
        boardUid: view.value.config.uid,
        postUid: view.value.post.uid,
        liked: isLiked,
      })

      if (!response.success) {
        toast(`❌ 좋아요 상태를 변경하지 못했습니다: ${response.error}`)
        return
      }
      if (isLiked) {
        toast(`✅ 이 게시글에 좋아요를 남겼습니다`)
      }
      view.value.post.liked = isLiked
    } catch (e) {
      toast(`❌ 좋아요 상태를 변경하지 못했습니다: ${e}`)
    }
  }

  // 게시글 검색하기
  const searchPost = () => {
    if (keyword.value.length < 2) {
      toast(`⚠️ 검색어는 2글자 이상 입력해주세요`)
      return
    }
    navigateTo(
      `/board/${list.value.config.id}/search/${
        optionLabels.value[option.value]
      }/${encodeURIComponent(keyword.value)}/1`,
    )
  }

  // 페이징 URL 생성하기
  const setPagingUrl = (targetPage: number) => {
    if (keyword.value.length > 1) {
      return `/board/${list.value.config.id}/search/${
        optionLabels.value[option.value]
      }/${encodeURIComponent(keyword.value)}/${targetPage}`
    }
    return `/board/${list.value.config.id}/page/${targetPage}`
  }

  return {
    error,
    latestLimit,
    pending,
    view,
    list,
    page,
    option,
    options,
    optionLabels,
    keyword,

    getInitView,
    getInitList,
    downloadFile,
    likePost,
    searchPost,
    setPagingUrl,
  }
})
