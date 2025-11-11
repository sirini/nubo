import type { Resp } from "~/types/common"

export const useEditor = () => {
  // 에디터에서 삽입할 이미지들 업로드
  const uploadEditorImages = async (token: string, boardUid: number, files: File[]) => {
    const { $api } = useNuxtApp()
    const fd = new FormData()
    fd.append("boardUid", boardUid.toString())
    for (const file of files) {
      fd.append("images[]", file)
    }

    const response = await $api<Resp<string[]>>("/editor/upload/images", {
      method: "POST",
      body: fd,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response
  }

  return {
    uploadEditorImages,
  }
}
