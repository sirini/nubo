import type { Editor } from "@tiptap/vue-3"
import { defineStore } from "pinia"
import type { AcceptableValue } from "reka-ui"
import { ref } from "vue"
import { toast } from "vue-sonner"
import { useEditor } from "~/client/composables/useEditor"
import {
  BOARD_CONFIG,
  type Pair,
  type BoardConfig,
  type EditorTagItem,
  type EditorInsertImageResult,
} from "~/types/board"
import type { HeadingLevel } from "~/types/editor"

export const useEditorStore = defineStore("editor", () => {
  const {
    uploadEditorImages,
    getBoardConfig,
    getSuggestionTags,
    getSuggestionTitles,
    getInsertedImages,
    removeInsertedImage,
  } = useEditor()
  const isUploading = ref<boolean>(false)
  const isImageUploadDialog = ref<boolean>(false)
  const isAddLinkDialog = ref<boolean>(false)
  const isNotice = ref<boolean>(false)
  const isSecret = ref<boolean>(false)
  const isDragging = ref<boolean>(false)
  const isSearchingTitles = ref<boolean>(false)
  const isSearchingTags = ref<boolean>(false)
  const config = ref<BoardConfig>(BOARD_CONFIG)
  const categories = ref<Pair[]>([])
  const editor = ref<Editor | null>(null)
  const images = ref<File[]>([])
  const attaches = ref<File[]>([])
  const previewImages = ref<string[]>([])
  const insertedImageResult = ref<EditorInsertImageResult | null>(null)
  const insertedImages = ref<Pair[]>([])
  const runtimeConfig = useRuntimeConfig()
  const headingLevel = ref<string>("")
  const content = ref<string>("")
  const title = ref<string>("")
  const tag = ref<string>("")
  const tags = ref<string[]>([])
  const titleSuggestions = ref<string[]>([])
  const tagSuggestions = ref<EditorTagItem[]>([])

  // 게시판 설정값 가져오기
  const loadBoardConfig = async (id: string) => {
    try {
      const response = await getBoardConfig(id)
      if (!response.success) {
        toast(`게시판 설정값들을 가져오지 못했습니다: ${response.error}`)
        return
      }
      config.value = response.result.config
      categories.value = response.result.categories
    } catch (e) {
      toast(`게시판 설정값들을 가져오지 못했습니다: ${e}`)
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
    let level: HeadingLevel | undefined

    if (typeof value === "string") {
      const parsed = parseInt(value, 10)
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
        level = parsed as HeadingLevel
      }
    } else if (typeof value === "number") {
      if (value >= 1 && value <= 6) {
        level = value as HeadingLevel
      }
    }

    if (!editor.value || level === undefined) {
      return
    }

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
  const selectedImages = (event: MouseEvent) => {
    previewImages.value.forEach((url) => URL.revokeObjectURL(url))
    previewImages.value = []
    images.value = []

    const targets = (event?.target as HTMLInputElement).files
    if (!targets) {
      return
    }

    let totalSize = 0
    const arr = Array.from(targets)
    for (const target of arr) {
      totalSize += target.size
      if (totalSize > parseInt(runtimeConfig.public.fileSize)) {
        toast(`파일 크기 제한을 초과하였습니다: ${totalSize} > ${runtimeConfig.public.fileSize}`)
        break
      }
      images.value.push(target)
      previewImages.value.push(URL.createObjectURL(target))
    }
    toast(`업로드 버튼을 클릭하셔야 파일이 올라갑니다`)
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
  const uploadingImages = async () => {
    try {
      isUploading.value = true
      const response = await uploadEditorImages(config.value.uid, images.value)
      if (!response.success) {
        toast(`이미지 파일 업로드에 실패하였습니다: ${response.error}`)
      }

      for (const src of response.result) {
        insertImageToEditor(src)
      }
      toast(`본문에 이미지를 삽입 하였습니다`)
    } catch (e) {
      toast(`이미지 파일 업로드에 실패하였습니다: ${e}`)
    } finally {
      isUploading.value = false
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
      let lastUid = insertedImages.value?.at(-1)?.uid || 0
      const response = await getInsertedImages(config.value.uid, lastUid, 6)
      if (!response.success) {
        toast(`기존에 삽입했던 이미지들을 가져오지 못했습니다: ${response.error}`)
        return
      }
      insertedImageResult.value = response.result

      if (lastUid === 0) {
        insertedImages.value = response.result.images
      } else {
        if (response.result.images.length < 1) {
          toast(`가져올 이전 사진들이 없습니다`)
          return
        }
        insertedImages.value.push(...response.result.images)
      }
    } catch (e) {
      toast(`기존에 삽입했던 이미지들을 가져오지 못했습니다: ${e}`)
    }
  }

  // 기존에 업로드했던 이미지 삭제하기
  const removeImage = async (imageUid: number) => {
    try {
      const response = await removeInsertedImage(imageUid)
      if (!response.success) {
        toast(`기존에 삽입했던 이미지를 삭제하지 못했습니다: ${response.error}`)
        return
      }
      await loadInsertedImages({ reset: true })
      toast(
        `정상적으로 삭제하였습니다 : 해당 이미지가 삽입된 게시글들은 더 이상 이미지가 표시되지 않습니다`,
      )
    } catch (e) {
      toast(`기존에 삽입했던 이미지를 삭제하지 못했습니다: ${e}`)
    }
  }

  // 유사한 글제목들 가져오기
  const searchTitles = useDebounceFn(async () => {
    if (title.value.length < 2) return
    try {
      isSearchingTitles.value = true
      const response = await getSuggestionTitles(title.value)
      if (!response.success) {
        toast(`유사한 글제목들을 조회하지 못했습니다: ${response.error}`)
        return
      }
      titleSuggestions.value = response.result
    } catch (e) {
      toast(`유사한 글제목들을 조회하지 못했습니다: ${e}`)
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
        toast(`유사한 태그들을 조회하지 못했습니다: ${response.error}`)
        return
      }
      tagSuggestions.value = response.result
    } catch (e) {
      toast(`유사한 태그들을 조회하지 못했습니다: ${e}`)
    } finally {
      isSearchingTags.value = false
    }
  }, 300)

  // 제안된 글제목 선택
  const selectTitle = (suggestion: string) => {
    title.value = suggestion
    titleSuggestions.value = []
  }

  // 해시태그 추가하기
  const addTag = () => {
    const val = tag.value.trim().replaceAll("#", "")
    if (val && !tags.value.includes(val)) {
      tags.value.push(val)
    }
    tag.value = ""
    tagSuggestions.value = []
  }

  // 해시태그 삭제하기
  const removeTag = (index: number) => {
    tags.value.splice(index, 1)
  }

  // 첨부파일 추가하기
  const handleAttachChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files) {
      attaches.value = Array.from(target.files)
    }
  }

  // 첨부파일 제거하기
  const removeAttach = (index: number) => {
    attaches.value.splice(index, 1)
  }

  // 첨부파일들 드롭 핸들러
  const dropAttaches = (e: DragEvent) => {
    isDragging.value = false
    const fileList = e.dataTransfer?.files
    if (fileList) {
      attaches.value = []
      for (const f of fileList) {
        attaches.value.push(f)
      }
    }
  }

  // 서버에 내용 전달하기
  const submit = async () => {}

  return {
    isUploading,
    isImageUploadDialog,
    isAddLinkDialog,
    isNotice,
    isSecret,
    isSearchingTitles,
    isSearchingTags,
    isDragging,
    config,
    editor,
    attaches,
    images,
    previewImages,
    insertedImageResult,
    insertedImages,
    headingLevel,
    content,
    title,
    titleSuggestions,
    tag,
    tagSuggestions,
    tags,

    loadBoardConfig,
    loadInsertedImages,
    selectColor,
    setLink,
    toggleHeading,
    isHeadingActive,
    selectedImages,
    uploadingImages,
    insertImageToEditor,
    removeImage,
    searchTitles,
    searchTags,
    selectTitle,
    addTag,
    removeTag,
    handleAttachChange,
    removeAttach,
    dropAttaches,
    submit,
  }
})
