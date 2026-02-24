import type { NuboEditorContext } from "./contexts/editor"

export const useEditorProvider = (): NuboEditorContext => {
  const config = useRuntimeConfig()
  const edit = useEditorStore()

  return {
    config: computed(() => edit.config),
    content: computed({ get: () => edit.content, set: (val: string) => (edit.content = val) }),
    isAddLinkDialog: computed({
      get: () => edit.isAddLinkDialog,
      set: (val: boolean) => (edit.isAddLinkDialog = val),
    }),
    isUploading: computed(() => edit.isUploading),
    imageSizeLimit: computed(() => config.public.imageSize),
    isImageUploadDialog: computed({
      get: () => edit.isImageUploadDialog,
      set: (val: boolean) => (edit.isImageUploadDialog = val),
    }),
    previewInsertImages: computed(() => edit.previewInsertImages),
    insertedImages: computed(() => edit.insertedImages),
    insertedImageResult: computed(() => edit.insertedImageResult),
    imageUrl: computed(() => edit.imageUrl),
    isBold: computed(() => edit.editor?.isActive("bold")),
    isItalic: computed(() => edit.editor?.isActive("italic")),
    isStrike: computed(() => edit.editor?.isActive("strike")),
    isBlockquote: computed(() => edit.editor?.isActive("blockquote")),
    isCode: computed(() => edit.editor?.isActive("code")),
    isCodeBlock: computed(() => edit.editor?.isActive("codeBlock")),

    setLink: (url: string) => {
      edit.setLink(url)
    },
    loadInsertedImages: (opt?: { reset: boolean } | undefined) => {
      edit.loadInsertedImages(opt)
    },
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
