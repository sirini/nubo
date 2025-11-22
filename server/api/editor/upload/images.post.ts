import { AUTH_KEY } from "~/types/common"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_KEY)
  const formData = await readFormData(event)
  const boardUid = formData.get("boardUid")
  const images = formData.getAll("images[]")

  if (!images || images.length === 0) {
    throw createError({ statusCode: 400, message: "No images" })
  }

  const fd = new FormData()
  fd.append("boardUid", boardUid as string)
  images.forEach((image: any) => {
    fd.append("images[]", image, image.name)
  })

  return await $fetch("/editor/upload/images", {
    baseURL: config.apiBaseInternal,
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: fd,
  })
})
