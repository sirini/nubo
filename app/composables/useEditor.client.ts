import type { Resp } from "~/types/common"
import type {
  EditorConfigResult,
  EditorInsertImageResult,
  EditorLoadPostResult,
  EditorModifyParam,
  EditorTagItem,
  EditorWriteParam,
} from "~/types/editor"

export const useEditor = () => {
  const { reqPost, reqGet, reqPatch, reqDelete } = useApi()

  // 에디터에서 삽입할 이미지들 업로드
  const uploadEditorImages = async (boardUid: number, files: File[]) => {
    const fd = new FormData()
    fd.append("boardUid", boardUid.toString())
    for (const file of files) {
      fd.append("images[]", file)
    }
    return await reqPost<Resp<string[]>>("/editor/upload/images", fd)
  }

  // 에디터에서 게시판 설정값 가져오기
  const getBoardConfig = async (id: string) => {
    return await reqGet<Resp<EditorConfigResult>>("/editor/config", { id })
  }

  // 추천 태그 목록 가져오기
  const getSuggestionTags = async (tag: string, limit: number = 10) => {
    return await reqGet<Resp<EditorTagItem[]>>("/editor/suggestion/tag", { tag, limit })
  }

  // 유사 게시글 제목들 가져오기
  const getSuggestionTitles = async (title: string, limit: number = 10) => {
    return await reqGet<Resp<string[]>>("/editor/suggestion/title", { title, limit })
  }

  // 본문 삽입용으로 이전에 올려둔 이미지 목록 가져오기
  const getInsertedImages = async (boardUid: number, lastUid: number, bunch: number = 12) => {
    return await reqGet<Resp<EditorInsertImageResult>>("/editor/load/images", {
      boardUid,
      lastUid,
      bunch,
    })
  }

  // 기존에 첨부파일로 업로드한 이미지의 썸네일 이미지 가져오기
  const getThumbnailImage = async (fileUid: number) => {
    return await reqGet<Resp<string>>("/editor/load/thumbnail", { fileUid })
  }

  // 수정할 게시글 내용 가져오기
  const loadOriginalPost = async (boardUid: number, postUid: number) => {
    return await reqGet<Resp<EditorLoadPostResult>>("/editor/load/post", { boardUid, postUid })
  }

  // 게시글 수정하기
  const modifyPrevPost = async (param: EditorModifyParam) => {
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

    return await reqPatch<Resp<null>>("/editor/modify", fd)
  }

  // 본문에 추가해뒀던 이미지 삭제하기
  const removeInsertedImage = async (imageUid: number) => {
    return await reqDelete<Resp<null>>("/editor/remove/image", { imageUid })
  }

  // 본문에 첨부했던 파일 삭제하기
  const editorRemoveAttachedFile = async (boardUid: number, postUid: number, fileUid: number) => {
    return await reqDelete<Resp<null>>("/editor/remove/attached", { boardUid, postUid, fileUid })
  }

  // 게시글 작성하기
  const writeNewPost = async (param: EditorWriteParam) => {
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
    return await reqPost<Resp<number>>("/editor/write", fd)
  }

  return {
    getBoardConfig,
    getInsertedImages,
    getSuggestionTags,
    getSuggestionTitles,
    getThumbnailImage,
    loadOriginalPost,
    modifyPrevPost,
    editorRemoveAttachedFile,
    removeInsertedImage,
    uploadEditorImages,
    writeNewPost,
  }
}
