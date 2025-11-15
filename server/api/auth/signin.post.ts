export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { id, password } = await readBody(event)
  if (!id || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID(email) and password are required",
    })
  }

  const body = new URLSearchParams()
  body.append("id", id)
  body.append("password", password)

  try {
    const raw = await $fetch.raw("/auth/signin", {
      baseURL: config.apiBaseInternal,
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    raw.headers.forEach((value, key) => {
      if (key === "set-cookie") {
        appendHeader(event, "set-cookie", value)
      }
    })

    return raw._data
  } catch (e) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to sign in",
    })
  }
})
