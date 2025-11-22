import type { EditorTagItem, EditorConfigResult, EditorInsertImageResult } from "~/types/board"
import type { Resp } from "~/types/common"

export const useEditor = () => {
  // 에디터에서 삽입할 이미지들 업로드
  const uploadEditorImages = async (boardUid: number, files: File[]) => {
    const { $api } = useNuxtApp()
    const fd = new FormData()
    fd.append("boardUid", boardUid.toString())
    for (const file of files) {
      fd.append("images[]", file)
    }

    return await $api<Resp<string[]>>("/editor/upload/images", {
      method: "POST",
      body: fd,
    })
  }

  // 에디터에서 게시판 설정값 가져오기
  const getBoardConfig = async (id: string) => {
    const { $api } = useNuxtApp()

    return await $api<Resp<EditorConfigResult>>("/editor/config", {
      method: "GET",
      query: {
        id,
      },
    })
  }

  // 추천 태그 목록 가져오기
  const getSuggestionTags = async (tag: string, limit: number = 10) => {
    const { $api } = useNuxtApp()

    return await $api<Resp<EditorTagItem[]>>("/editor/suggestion/tag", {
      method: "GET",
      query: {
        tag,
        limit,
      },
    })
  }

  // 유사 게시글 제목들 가져오기
  const getSuggestionTitles = async (title: string, limit: number = 10) => {
    const { $api } = useNuxtApp()

    return await $api<Resp<string[]>>("/editor/suggestion/title", {
      method: "GET",
      query: {
        title,
        limit,
      },
    })
  }

  // 본문 삽입용으로 이전에 올려둔 이미지 목록 가져오기
  const getInsertedImages = async (boardUid: number, lastUid: number, bunch: number = 12) => {
    const { $api } = useNuxtApp()

    return await $api<Resp<EditorInsertImageResult>>("/editor/load/images", {
      method: "GET",
      query: {
        boardUid,
        lastUid,
        bunch,
      },
    })
  }

  return {
    uploadEditorImages,
    getBoardConfig,
    getSuggestionTags,
    getSuggestionTitles,
    getInsertedImages,
  }
}
