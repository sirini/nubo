import type { NuboEditorContext } from "~/types/nubo-skin-keys"

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
  }
}
