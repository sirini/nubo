import type { NuboWriteContext } from "./contexts/write"

export const useWriteProvider = (): NuboWriteContext => {
  const edit = useEditorStore()
  const auth = useAuthStore()
  const router = useRouter()

  return {
    tag: computed({ get: () => edit.tag, set: (val: string) => (edit.tag = val) }),
    tags: computed(() => edit.tags),
    tagSuggestions: computed(() => edit.tagSuggestions),
    attaches: computed(() => edit.attaches),
    files: computed(() => edit.files),
    isLoggedIn: computed(() => auth.isLoggedIn),
    isDragging: computed({
      get: () => edit.isDragging,
      set: (val: boolean) => (edit.isDragging = val),
    }),
    isPopOver: computed(() => edit.isPopOver),
    isAdmin: computed(() => edit.isAdmin),
    isNotice: computed({ get: () => edit.isNotice, set: (val: boolean) => (edit.isNotice = val) }),
    isSecret: computed({ get: () => edit.isSecret, set: (val: boolean) => (edit.isSecret = val) }),
    categoryUid: computed({
      get: () => edit.categoryUid,
      set: (val: number) => (edit.categoryUid = val),
    }),
    categories: computed(() => edit.categories),
    title: computed({ get: () => edit.title, set: (val: string) => (edit.title = val) }),
    titleSuggestions: computed({
      get: () => edit.titleSuggestions,
      set: (val: string[]) => (edit.titleSuggestions = val),
    }),
    isSearchingTitles: computed(() => edit.isSearchingTitles),
    isConfirmDialog: computed({
      get: () => edit.isConfirmDialog,
      set: (val: boolean) => (edit.isConfirmDialog = val),
    }),
    isWriting: computed({
      get: () => edit.isWriting,
      set: (val: boolean) => (edit.isWriting = val),
    }),

    writeNewPost: async () => {
      await edit.submit()
    },
    cancelNewPost: () => {
      edit.preserveDraftAndReset()
      router.back()
    },
    cancelEditPost: () => {
      edit.resetForm()
      router.back()
    },
    dropAttaches: (event: DragEvent) => {
      edit.dropAttaches(event)
    },
    changeFileList: (event: Event) => {
      edit.changeFileList(event)
    },
    getPreviewThumbnail: (filename: string) => {
      const thumb = edit.previewEditorSelectedImages.find((f) => f.name === filename)
      return thumb?.url || ""
    },
    getUploadedThumbnail: (fileUid: number) => {
      const thumb = edit.thumbnails.find((f) => f.fileUid === fileUid)
      return thumb?.thumbnail || ""
    },
    openPopOver: useDebounceFn((name: string) => {
      edit.isPopOver[name] = true
    }, 100),
    closePopOver: useDebounceFn((name: string) => {
      edit.isPopOver[name] = false
    }, 100),
    selectSuggestedTag: (tag: string) => {
      edit.tag = tag
      edit.addTag()
    },
    addTag: () => {
      edit.addTag()
    },
    removeTag: (index: number) => {
      edit.removeTag(index)
    },
    changeSelectedImages: (event: MouseEvent) => {
      const targets = (event?.target as HTMLInputElement).files
      edit.changeSelectedImages(targets)
    },
    selectSuggestedTitle: (title: string) => {
      edit.selectSuggestedTitle(title)
    },
    removeFromList: (index: number) => {
      edit.removeFromList(index)
    },
    confirmRemoveFile: (fileUid: number, index: number) => {
      edit.confirmRemoveFile(fileUid, index)
    },
    modifyExistPost: async () => {
      await edit.modify()
    },
    removeAttachedFile: async () => {
      await edit.removeAttachedFile()
    },
  }
}
