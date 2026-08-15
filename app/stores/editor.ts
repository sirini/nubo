import type { Editor } from "@tiptap/vue-3"
import { defineStore } from "pinia"
import type { AcceptableValue } from "reka-ui"
import { ref } from "vue"
import { toast } from "vue-sonner"
import { useEditor } from "~/composables/useEditor.client"
import {
  BOARD,
  BOARD_CONFIG,
  STATUS,
  type BoardAttachment,
  type BoardConfig,
  type WriteDraftParam,
} from "~/types/board"
import type { Pair } from "~/types/common"
import type {
  EditorHeadings,
  EditorInsertImageResult,
  EditorModifyParam,
  EditorPreviewAttachedImage,
  EditorRemoveAttached,
  EditorSelectedImage,
  EditorTagItem,
  EditorWriteParam,
} from "~/types/editor"
import { useLocalStorage, useDebounceFn } from "#imports"

export const useEditorStore = defineStore("editor", () => {
  const trade = useTradeStore()
  const nuxtConfig = useRuntimeConfig()
  const {
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
  } = useEditor()
  const attaches = ref<File[]>([])
  const categories = ref<Pair[]>([])
  const categoryUid = ref<number>(1)
  const config = ref<BoardConfig>(BOARD_CONFIG)
  const content = ref<string>("")
  const editor = shallowRef<Editor | null>(null)
  const editorHeadings = ref<string>("")
  const editorRemoveAttachedInfo = ref<EditorRemoveAttached>({ fileUid: 0, index: 0 })
  const files = ref<BoardAttachment[]>([])
  const images = ref<File[]>([])
  const insertedImageResult = ref<EditorInsertImageResult | null>(null)
  const insertedImages = ref<Pair[]>([])
  const isAddLinkDialog = ref<boolean>(false)
  const isConfirmDialog = ref<boolean>(false)
  const isDragging = ref<boolean>(false)
  const isImageUploadDialog = ref<boolean>(false)
  const isNotice = ref<boolean>(false)
  const isPopOver = ref<Record<string, boolean>>({})
  const isSearchingTags = ref<boolean>(false)
  const isSearchingTitles = ref<boolean>(false)
  const isSecret = ref<boolean>(false)
  const isUploading = ref<boolean>(false)
  const isWriting = ref<boolean>(false)
  const imageUrl = ref<string>("")
  const postUid = ref<number>(0)
  const previewEditorSelectedImages = ref<EditorSelectedImage[]>([])
  const previewInsertImages = ref<string[]>([])
  const runtimeConfig = useRuntimeConfig()
  const tag = ref<string>("")
  const tags = ref<string[]>([])
  const tagSuggestions = ref<EditorTagItem[]>([])
  const thumbnails = ref<EditorPreviewAttachedImage[]>([])
  const title = ref<string>("")
  const titleSuggestions = ref<string[]>([])
  // localStorage 값은 이전 버전 또는 수동 변경으로 타입이 깨질 수 있으므로 외부 입력으로 취급
  const draftPost = useLocalStorage<unknown>("nubo-draft-post", null)
  let draftSaveTimer: ReturnType<typeof setTimeout> | undefined

  const normalizeDraft = (value: unknown): WriteDraftParam | null => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null

    const draft = value as Record<string, unknown>
    return {
      boardId: typeof draft.boardId === "string" ? draft.boardId : undefined,
      title: typeof draft.title === "string" ? draft.title : "",
      content: typeof draft.content === "string" ? draft.content : "",
      tags: Array.isArray(draft.tags)
        ? draft.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      isSecret: draft.isSecret === true,
      isNotice: draft.isNotice === true,
      categoryUid:
        typeof draft.categoryUid === "number" && Number.isFinite(draft.categoryUid)
          ? draft.categoryUid
          : 0,
      trade: draft.trade && typeof draft.trade === "object"
        ? draft.trade as WriteDraftParam["trade"]
        : undefined,
      updatedAt:
        typeof draft.updatedAt === "number" && Number.isFinite(draft.updatedAt)
          ? draft.updatedAt
          : undefined,
    }
  }

  const normalizedDraft = computed(() => normalizeDraft(draftPost.value))

  const hasMeaningfulContent = (html: string) => {
    const hasContentNode = /<(img|table|pre|blockquote|ul|ol)\b/i.test(html)
    const textContent = html
      .replace(/<[^>]*>/g, "")
      .replaceAll("&nbsp;", " ")
      .trim()
    return hasContentNode || textContent.length > 0
  }

  const hasDraftContent = computed(() => {
    const draft = normalizedDraft.value
    if (!draft || (draft.boardId && draft.boardId !== config.value.id)) return false

    return (
      draft.title.trim().length > 0 ||
      hasMeaningfulContent(draft.content) ||
      draft.tags.length > 0
    )
  })
  const isLoadDraft = computed(() => hasDraftContent.value)

  // 게시판 설정값 가져오기
  const loadBoardConfig = async (id: string) => {
    try {
      const response = await getBoardConfig(id)
      if (!response.success) {
        toast(`❌ 게시판 설정값들을 가져오지 못했습니다: ${response.error}`)
        return
      }
      config.value = response.result.config
      categories.value = response.result.categories
    } catch (e) {
      toast(`❌ 게시판 설정값들을 가져오지 못했습니다: ${e}`)
    }
  }

  // 글자 색상 변경하기
  const selectColor = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target && editor.value) {
      editor.value.chain().focus().setColor(target.value).run()
    }
  }

  // 링크 설정하기
  const setLink = (url: string) => {
    if (!editor.value) return
    if (url === "") {
      editor.value.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.value.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  // 헤딩 선택하기
  const toggleHeading = (value: AcceptableValue) => {
    let level: EditorHeadings | undefined

    if (typeof value === "string") {
      const parsed = parseInt(value, 10)
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) {
        level = parsed as EditorHeadings
      }
    } else if (typeof value === "number") {
      if (value >= 1 && value <= 4) {
        level = value as EditorHeadings
      }
    }

    if (!editor.value) {
      return
    }

    if (String(value) === "0") {
      editor.value.chain().focus().setParagraph().run()
      return
    }

    if (level === undefined) return

    editor.value.chain().focus().toggleHeading({ level }).run()
  }

  // 헤딩이 선택되었는지 확인하기
  const isHeadingActive = () => {
    if (!editor.value) return false

    return (
      editor.value.isActive("heading", { level: 1 }) ||
      editor.value.isActive("heading", { level: 2 }) ||
      editor.value.isActive("heading", { level: 3 }) ||
      editor.value.isActive("heading", { level: 4 })
    )
  }

  // 선택한 이미지 파일들을 미리 보여주기
  const changeSelectedImages = (targets: FileList | null) => {
    previewInsertImages.value.forEach((url) => URL.revokeObjectURL(url))
    previewInsertImages.value = []
    images.value = []

    if (!targets) {
      return
    }

    let totalSize = 0
    const arr = Array.from(targets)
    for (const target of arr) {
      totalSize += target.size
      if (totalSize > parseInt(runtimeConfig.public.fileSize)) {
        toast(`⚠️ 파일 크기 제한을 초과하였습니다: ${totalSize} > ${runtimeConfig.public.fileSize}`)
        break
      }
      images.value.push(target)
      previewInsertImages.value.push(URL.createObjectURL(target))
    }
    toast(`⚠️ 업로드 버튼을 클릭하셔야 파일이 올라갑니다`)
  }

  // 본문 작성란에 이미지 삽입하기
  const insertImageToEditor = (src: string) => {
    if (editor.value) {
      editor.value.commands.focus()
      editor.value.commands.setImage({ src })
      editor.value.commands.enter()
    }
  }

  // 선택된 이미지 파일들 업로드하고 작성란에 추가하기
  const uploadContentImages = async (files: File[]) => {
    if (isUploading.value) {
      toast(`⚠️ 다른 이미지를 업로드하고 있습니다`)
      return []
    }

    const targets = files.filter((file) => file.type.startsWith("image/"))
    if (targets.length < 1) {
      toast(`⚠️ 업로드할 이미지 파일이 없습니다`)
      return []
    }

    const totalSize = targets.reduce((sum, file) => sum + file.size, 0)
    const sizeLimit = parseInt(runtimeConfig.public.fileSize)
    if (totalSize > sizeLimit) {
      toast(`⚠️ 파일 크기 제한을 초과하였습니다: ${totalSize} > ${sizeLimit}`)
      return []
    }

    try {
      isUploading.value = true
      const response = await uploadEditorImages(config.value.uid, targets)
      if (!response.success) {
        toast(`❌ 이미지 파일 업로드에 실패하였습니다: ${response.error}`)
        return []
      }
      await loadInsertedImages({ reset: true })
      return response.result
    } catch (e) {
      toast(`❌ 이미지 파일 업로드에 실패하였습니다: ${e}`)
      return []
    } finally {
      isUploading.value = false
    }
  }

  // 이미지 추가창에서 선택한 파일들을 업로드하고 작성란에 추가하기
  const uploadingImages = async () => {
    try {
      const sources = await uploadContentImages(images.value)
      for (const src of sources) insertImageToEditor(src)
      if (sources.length > 0) toast(`✅ 본문에 이미지를 삽입하였습니다`)
    } finally {
      images.value = []
      isImageUploadDialog.value = false
    }
  }

  // 기존에 업로드했던 이미지 목록들 불러오기
  const loadInsertedImages = async (opt?: { reset: boolean }) => {
    try {
      if (opt?.reset) {
        insertedImages.value = []
      }
      const lastUid = insertedImages.value?.at(-1)?.uid || 0
      const response = await getInsertedImages(config.value.uid, lastUid, 6)
      if (!response.success) {
        toast(`❌ 기존에 삽입했던 이미지들을 가져오지 못했습니다: ${response.error}`)
        return
      }
      insertedImageResult.value = response.result

      if (lastUid === 0) {
        insertedImages.value = response.result.images
      } else {
        if (isImageUploadDialog.value && response.result.images.length < 1) {
          toast(`⚠️ 가져올 이전 사진들이 없습니다`)
          return
        }
        insertedImages.value.push(...response.result.images)
      }
    } catch (e) {
      toast(`❌ 기존에 삽입했던 이미지들을 가져오지 못했습니다: ${e}`)
    }
  }

  // 기존에 업로드했던 이미지 삭제하기
  const deleteInsertedImage = async (imageUid: number) => {
    try {
      const response = await removeInsertedImage(imageUid)
      if (!response.success) {
        toast(`❌ 기존에 삽입했던 이미지를 삭제하지 못했습니다: ${response.error}`)
        return
      }
      await loadInsertedImages({ reset: true })
      toast(
        `✅ 정상적으로 삭제하였습니다: 해당 이미지가 삽입된 게시글들은 더 이상 이미지가 표시되지 않습니다`,
      )
    } catch (e) {
      toast(`❌ 기존에 삽입했던 이미지를 삭제하지 못했습니다: ${e}`)
    }
  }

  // 유사한 글제목들 가져오기
  const searchTitles = useDebounceFn(async () => {
    if (title.value.length < 2) {
      titleSuggestions.value = []
      return
    }
    try {
      isSearchingTitles.value = true
      const response = await getSuggestionTitles(title.value, 5)
      if (!response.success) {
        toast(`❌ 유사한 글제목들을 조회하지 못했습니다: ${response.error}`)
        return
      }
      titleSuggestions.value = response.result.slice(0, 5)
    } catch (e) {
      toast(`❌ 유사한 글제목들을 조회하지 못했습니다: ${e}`)
    } finally {
      isSearchingTitles.value = false
    }
  })

  // 추천 태그 목록 가져오기
  const searchTags = useDebounceFn(async () => {
    if (tag.value.length < 2) return
    try {
      isSearchingTags.value = true
      const response = await getSuggestionTags(tag.value)
      if (!response.success) {
        toast(`❌ 유사한 태그들을 조회하지 못했습니다: ${response.error}`)
        return
      }
      tagSuggestions.value = response.result
    } catch (e) {
      toast(`❌ 유사한 태그들을 조회하지 못했습니다: ${e}`)
    } finally {
      isSearchingTags.value = false
    }
  }, 150)

  // 제안된 글제목 선택
  const selectSuggestedTitle = (suggestion: string) => {
    title.value = suggestion
    titleSuggestions.value = []
  }

  // 해시태그 추가하기
  const addTag = useDebounceFn(async () => {
    const val = tag.value.trim().replace(/[^a-zA-Z0-9_ㄱ-ㅎㅏ-ㅣ가-힣]/g, "")
    if (val && !tags.value.includes(val)) {
      tags.value.push(val)
    }
    tag.value = ""
    tagSuggestions.value = []
  }, 150)

  // 해시태그 삭제하기
  const removeTag = (index: number) => {
    tags.value.splice(index, 1)
  }

  // 첨부파일들을 추가하고, 이미지는 따로 미리보기용 URL 만들어서 보관
  const manageAttachments = (fileList: FileList) => {
    let totalSize = 0
    const totalLimit = parseInt(nuxtConfig.public.fileSize)
    previewEditorSelectedImages.value.forEach((img) => URL.revokeObjectURL(img.url))
    previewEditorSelectedImages.value = []
    attaches.value = []
    const files = Array.from(fileList)

    files.forEach((file) => {
      totalSize += file.size
      if (totalSize > totalLimit) {
        toast(`⚠️ 첨부 제한 크기를 초과하였습니다: 이후 파일들은 추가되지 않습니다`)
        return
      }
      attaches.value.push(file)
      if (file.type.startsWith("image/")) {
        previewEditorSelectedImages.value.push({
          name: file.name,
          url: URL.createObjectURL(file),
        })
      }
    })
  }

  // 첨부파일 추가하기
  const changeFileList = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files) {
      manageAttachments(target.files)
    }
    target.value = ""
  }

  // 아직 업로드 안된 첨부파일 제거하기
  const removeFromList = (index: number) => {
    attaches.value.splice(index, 1)
  }

  // 정말로 업로드된 첨부를 삭제할건지 물어보기
  const confirmRemoveFile = (fileUid: number, index: number) => {
    editorRemoveAttachedInfo.value = { fileUid, index }
    isConfirmDialog.value = true
  }

  // 글 수정시 이미 첨부되어 있던 파일을 제거하기
  const removeAttachedFile = async () => {
    const { fileUid, index } = editorRemoveAttachedInfo.value
    if (fileUid < 1 || index < 0) {
      toast(`⚠️ 삭제할 첨부 파일이 제대로 지정되지 않았습니다`)
      return
    }
    try {
      const response = await editorRemoveAttachedFile(config.value.uid, postUid.value, fileUid)
      if (!response.success) {
        toast(`❌ 첨부파일을 삭제하지 못했습니다: ${response.error}`)
        return
      }
      files.value.splice(index, 1)
      toast(`✅ 파일을 정상적으로 삭제하였습니다`)
    } catch (e) {
      toast(`❌ 첨부파일을 삭제하지 못했습니다: ${e}`)
    } finally {
      editorRemoveAttachedInfo.value = { fileUid: 0, index: 0 }
      isConfirmDialog.value = false
    }
  }

  // 첨부파일들 드롭 핸들러
  const dropAttaches = (e: DragEvent) => {
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (files) {
      manageAttachments(files)
    }
  }

  // 현재 입력 폼만 초기화 (새 글 임시 보관본은 유지)
  const resetForm = () => {
    previewEditorSelectedImages.value.forEach((img) => URL.revokeObjectURL(img.url))
    previewEditorSelectedImages.value = []
    attaches.value = []
    content.value = ""
    files.value = []
    isNotice.value = false
    isSecret.value = false
    isWriting.value = false
    tags.value = []
    title.value = ""
    thumbnails.value = []
  }

  // 작성 완료 후 입력 폼과 임시 보관본 초기화
  const clear = () => {
    cancelDraftSave()
    resetForm()
    draftPost.value = null
  }

  // 공통 파라미터들 반환
  const getParams = () => {
    return {
      boardUid: config.value.uid,
      categoryUid: categoryUid.value,
      trade: config.value.type === BOARD.TRADE ? { ...trade.form } : undefined,
      content: content.value.trim().replaceAll("<p></p>", "<p>&nbsp;</p>"),
      files: attaches.value,
      isNotice: isNotice.value,
      isSecret: isSecret.value,
      tags: tags.value,
      title: title.value.trim(),
    }
  }

  // 서버에 새로운 글쓰기 전송하기
  const submit = async () => {
    if (title.value.trim().length < 2) {
      toast(`⚠️ 글 제목은 2글자 이상이어야 합니다`)
      return
    }
    if (content.value.trim().length < 2) {
      toast(`⚠️ 글 내용은 3글자 이상이어야 합니다`)
      return
    }
    const param: EditorWriteParam = getParams()
    try {
      isWriting.value = true
      const response = config.value.type === BOARD.TRADE
        ? await trade.writePost({ ...param, ...trade.form })
        : await writeNewPost(param)
      if (!response.success) {
        toast(`❌ 게시글을 작성하지 못했습니다: ${response.error}`)
        return
      }
      const writtenPostUid = typeof response.result === "number" ? response.result : response.result?.postUid
      if (writtenPostUid > 0) {
        clear()
        trade.resetForm()
        navigateTo(`/board/${config.value.id}/${writtenPostUid}`)
      }
    } catch (e) {
      toast(`❌ 게시글을 작성하지 못했습니다: ${e}`)
    } finally {
      isWriting.value = false
    }
  }

  // 서버에 기존글 수정 내용 전송하기
  const modify = async () => {
    if (title.value.trim().length < 2) {
      toast(`⚠️ 글 제목은 2글자 이상이어야 합니다`)
      return
    }
    if (content.value.trim().length < 2) {
      toast(`⚠️ 글 내용은 3글자 이상이어야 합니다`)
      return
    }
    const wp: EditorWriteParam = getParams()
    const param: EditorModifyParam = {
      ...wp,
      postUid: postUid.value,
    }

    try {
      isWriting.value = true
      const response = config.value.type === BOARD.TRADE
        ? await trade.modifyPost({ ...param, ...trade.form })
        : await modifyPrevPost(param)
      if (!response.success) {
        toast(`❌ 게시글을 수정하지 못했습니다: ${response.error}`)
        return
      }
      resetForm()
      navigateTo(`/board/${config.value.id}/${postUid.value}`)
    } catch (e) {
      toast(`❌ 게시글을 수정하지 못했습니다: ${e}`)
    } finally {
      isWriting.value = false
    }
  }

  // 기존에 작성해둔 글 내용 가져오기
  const loadPost = async () => {
    try {
      const response = await loadOriginalPost(config.value.uid, postUid.value)
      if (!response.success) {
        toast(`❌ 게시글 내용을 가져오지 못했습니다: ${response.error}`)
        return
      }

      resetForm()
      const post = response.result.post

      if (post.status === STATUS.REMOVED) {
        toast(`❌ 게시글이 삭제되어 수정할 수 없습니다`)
        navigateTo(`/board/${config.value.id}/page/1`)
      }
      response.result.tags.forEach((tag) => tags.value.push(tag.name))
      isNotice.value = post.status === STATUS.NOTICE
      isSecret.value = post.status === STATUS.SECRET
      categoryUid.value = post.category.uid
      content.value = post.content
      title.value = recoverChars(post.title)
      files.value = response.result.files
      files.value.forEach(async (file) => {
        const thumbnail = await getThumb(file.uid)
        thumbnails.value.push({
          fileUid: file.uid,
          isPopOver: false,
          thumbnail,
        })
      })
    } catch (e) {
      toast(`❌ 게시글 내용을 가져오지 못했습니다: ${e}`)
    }
  }

  // 기존에 첨부한 이미지 파일의 썸네일 경로 가져오기
  const getThumb = async (fileUid: number) => {
    try {
      const response = await getThumbnailImage(fileUid)
      if (!response.success) {
        return ""
      }
      return response.result
    } catch {
      console.error(`❌ 미리보기 이미지가 없습니다: ${fileUid}`)
    }
    return ""
  }

  const persistDraft = () => {
    draftPost.value = {
      boardId: config.value.id,
      title: title.value,
      content: content.value,
      tags: [...tags.value],
      isSecret: isSecret.value,
      isNotice: isNotice.value,
      categoryUid: categoryUid.value,
      updatedAt: Date.now(),
    }
  }

  const hasCurrentContent = () => {
    return (
      title.value.trim().length > 0 || hasMeaningfulContent(content.value) || tags.value.length > 0
    )
  }

  const cancelDraftSave = () => {
    if (draftSaveTimer) clearTimeout(draftSaveTimer)
    draftSaveTimer = undefined
  }

  // 입력 발생 시 호출할 디바운스 함수
  const saveDraft = () => {
    cancelDraftSave()
    draftSaveTimer = setTimeout(persistDraft, 3000)
  }

  const flushDraft = () => {
    cancelDraftSave()
    if (hasCurrentContent()) persistDraft()
  }

  // 화면을 떠날 때 최신 내용을 보관하고 공유 중인 입력 상태는 비우기
  const preserveDraftAndReset = () => {
    flushDraft()
    resetForm()
  }

  // 임시 보관중이던 글 불러오기
  const loadDraft = () => {
    const draft = normalizedDraft.value
    if (!draft || !hasDraftContent.value) return

    title.value = draft.title
    content.value = draft.content
    tags.value = [...draft.tags]
    isSecret.value = draft.isSecret
    isNotice.value = draft.isNotice
    categoryUid.value = draft.categoryUid
    if (draft.trade) Object.assign(trade.form, draft.trade)
  }

  return {
    attaches,
    categories,
    categoryUid,
    config,
    content,
    draftPost,
    editor,
    editorHeadings,
    editorRemoveAttachedInfo,
    files,
    images,
    imageUrl,
    insertedImageResult,
    insertedImages,
    isAddLinkDialog,
    isConfirmDialog,
    isDragging,
    isLoadDraft,
    isImageUploadDialog,
    isNotice,
    isPopOver,
    isSearchingTags,
    isSearchingTitles,
    isSecret,
    isUploading,
    isWriting,
    postUid,
    previewEditorSelectedImages,
    previewInsertImages,
    tag,
    tags,
    tagSuggestions,
    thumbnails,
    title,
    titleSuggestions,

    addTag,
    changeFileList,
    changeSelectedImages,
    confirmRemoveFile,
    clear,
    cancelDraftSave,
    deleteInsertedImage,
    dropAttaches,
    flushDraft,
    getThumb,
    insertImageToEditor,
    isHeadingActive,
    loadBoardConfig,
    loadDraft,
    loadInsertedImages,
    loadPost,
    modify,
    removeAttachedFile,
    removeFromList,
    removeTag,
    resetForm,
    preserveDraftAndReset,
    saveDraft,
    searchTags,
    searchTitles,
    selectColor,
    selectSuggestedTitle,
    setLink,
    submit,
    toggleHeading,
    uploadContentImages,
    uploadingImages,
  }
})
