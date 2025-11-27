import type { EditorTagItem, EditorConfigResult, EditorInsertImageResult } from "~/types/board"
import type { Resp } from "~/types/common"
import type { ModifyPostParam, WritePostParam } from "~/types/editor"

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
      query: { id },
    })
  }

  // 추천 태그 목록 가져오기
  const getSuggestionTags = async (tag: string, limit: number = 10) => {
    const { $api } = useNuxtApp()
    return await $api<Resp<EditorTagItem[]>>("/editor/suggestion/tag", {
      method: "GET",
      query: { tag, limit },
    })
  }

  // 유사 게시글 제목들 가져오기
  const getSuggestionTitles = async (title: string, limit: number = 10) => {
    const { $api } = useNuxtApp()
    return await $api<Resp<string[]>>("/editor/suggestion/title", {
      method: "GET",
      query: { title, limit },
    })
  }

  // 본문 삽입용으로 이전에 올려둔 이미지 목록 가져오기
  const getInsertedImages = async (boardUid: number, lastUid: number, bunch: number = 12) => {
    const { $api } = useNuxtApp()
    return await $api<Resp<EditorInsertImageResult>>("/editor/load/images", {
      method: "GET",
      query: { boardUid, lastUid, bunch },
    })
  }

  // 게시글 수정하기
  const modifyPrevPost = async (param: ModifyPostParam) => {
    const { $api } = useNuxtApp()
    const fd = new FormData()
    fd.append("boardUid", param.boardUid.toString())
    fd.append("categoryUid", param.categoryUid.toString())
    fd.append("content", param.content)
    fd.append("isNotice", param.isNotice ? "1" : "0")
    fd.append("isSecret", param.isSecret ? "1" : "0")
    fd.append("postUid", param.postUid.toString())
    fd.append("title", param.title)
    fd.append("tags", param.tags.join(","))
    for (const file of param.files) {
      fd.append("attachments[]", file)
    }
    return await $api<Resp<null>>("/editor/modify", {
      method: "POST",
      body: fd,
    })
  }

  // 본문에 추가해뒀던 이미지 삭제하기
  const removeInsertedImage = async (imageUid: number) => {
    const { $api } = useNuxtApp()
    return await $api<Resp<null>>("/editor/remove/image", {
      method: "DELETE",
      query: { imageUid },
    })
  }

  // 본문에 첨부했던 파일 삭제하기
  const removeAttachedFile = async (boardUid: number, postUid: number, fileUid: number) => {
    const { $api } = useNuxtApp()
    return await $api<Resp<null>>("/editor/remove/attached", {
      method: "DELETE",
      query: { boardUid, postUid, fileUid },
    })
  }

  // 게시글 작성하기
  const writeNewPost = async (param: WritePostParam) => {
    const { $api } = useNuxtApp()
    const fd = new FormData()
    fd.append("boardUid", param.boardUid.toString())
    fd.append("categoryUid", param.categoryUid.toString())
    fd.append("content", param.content)
    fd.append("isNotice", param.isNotice ? "1" : "0")
    fd.append("isSecret", param.isSecret ? "1" : "0")
    fd.append("title", param.title)
    fd.append("tags", param.tags.join(","))
    for (const file of param.files) {
      fd.append("attachments[]", file)
    }
    return await $api<Resp<number>>("/editor/write", {
      method: "POST",
      body: fd,
    })
  }

  return {
    uploadEditorImages,
    getBoardConfig,
    getSuggestionTags,
    getSuggestionTitles,
    getInsertedImages,
    removeInsertedImage,
    removeAttachedFile,
    writeNewPost,
    modifyPrevPost,
  }
}
