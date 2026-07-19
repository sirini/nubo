import type { NuboEditorContext } from "./contexts/editor"

export const useEditorProvider = (): NuboEditorContext => {
  const config = useRuntimeConfig()
  const edit = useEditorStore()

  return {
    config: computed(() => edit.config),
    content: computed({ get: () => edit.content, set: (val: string) => (edit.content = val) }),
    imageSizeLimit: computed(() => config.public.imageSize),
    imageUrl: computed(() => edit.imageUrl),
    insertedImageResult: computed(() => edit.insertedImageResult),
    insertedImages: computed(() => edit.insertedImages),
    isAddLinkDialog: computed({
      get: () => edit.isAddLinkDialog,
      set: (val: boolean) => (edit.isAddLinkDialog = val),
    }),
    isBlockquote: computed(() => edit.editor?.isActive("blockquote")),
    isBold: computed(() => edit.editor?.isActive("bold")),
    isCode: computed(() => edit.editor?.isActive("code")),
    isCodeBlock: computed(() => edit.editor?.isActive("codeBlock")),
    isImageUploadDialog: computed({
      get: () => edit.isImageUploadDialog,
      set: (val: boolean) => (edit.isImageUploadDialog = val),
    }),
    isItalic: computed(() => edit.editor?.isActive("italic")),
    isLoadDraft: computed(() => edit.isLoadDraft),
    isStrike: computed(() => edit.editor?.isActive("strike")),
    isUploading: computed(() => edit.isUploading),
    previewInsertImages: computed(() => edit.previewInsertImages),

    setLink: (url: string) => {
      edit.setLink(url)
    },
    loadInsertedImages: (opt?: { reset: boolean } | undefined) => {
      edit.loadInsertedImages(opt)
    },
    loadDraft: () => edit.loadDraft(),
    uploadingImages: async () => {
      await edit.uploadingImages()
    },
    insertImageToEditor: (src: string) => {
      edit.insertImageToEditor(src)
    },
    deleteInsertedImage: async (imageUid: number) => {
      await edit.deleteInsertedImage(imageUid)
    },
    toggleBold: () => {
      return edit.editor?.chain().focus().toggleBold().run() || false
    },
    toggleItalic: () => {
      return edit.editor?.chain().focus().toggleItalic().run() || false
    },
    toggleStrike: () => {
      return edit.editor?.chain().focus().toggleStrike().run() || false
    },
    toggleBlockquote: () => {
      return edit.editor?.chain().focus().toggleBlockquote().run() || false
    },
    toggleCode: () => {
      return edit.editor?.chain().focus().toggleCode().run() || false
    },
    toggleCodeBlock: () => {
      return edit.editor?.chain().focus().toggleCodeBlock().run() || false
    },
    undo: () => {
      return edit.editor?.chain().focus().undo().run() || false
    },
    redo: () => {
      return edit.editor?.chain().focus().redo().run() || false
    },
    getAttr: (name: string) => {
      return edit.editor?.getAttributes(name) || {}
    },
    selectTextColor: (event: Event) => {
      edit.selectColor(event)
    },
  }
}
