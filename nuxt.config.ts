import tailwindcss from "@tailwindcss/vite"

const GOAPI = "http://localhost:3006/goapi" // GOAPI 백엔드 주소

export default defineNuxtConfig({
  srcDir: "app/",
  runtimeConfig: {
    apiBaseInternal: GOAPI,
    public: {
      apiBase: "/api",
      goapi: GOAPI,
      version: process.env.NUXT_PUBLIC_VERSION || "v2.0.0",
      url: process.env.NUXT_PUBLIC_URL || "https://nubohub.org",
      urlPrefix: process.env.NUXT_PUBLIC_URL_PREFIX || "",
      title: process.env.NUXT_PUBLIC_TITLE || "The Nubo | Networked Utilities & Builtin Options",
      imageSize: {
        profile: process.env.NUXT_PUBLIC_PROFILE_SIZE || "256",
        contentInsert: process.env.NUXT_PUBLIC_CONTENT_INSERT_SIZE || "1024",
        thumbnail: process.env.NUXT_PUBLIC_THUMBNAIL_SIZE || "512",
      },
      fileSize: process.env.NUXT_PUBLIC_FILE_SIZE_LIMIT || "104857600",
    },
  },
  compatibilityDate: "2025-05-15",
  devtools: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
  css: ["~/assets/css/tailwind.css"],
  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/scripts",
    "shadcn-nuxt",
    "@nuxtjs/google-fonts",
    "@nuxtjs/color-mode",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],
  googleFonts: {
    display: "swap",
    preconnect: true,
    download: false,
    families: {
      Inter: [400, 500, 700],
      "Google Sans Code": [400, 500, 700],
      "Noto Sans KR": [400, 500, 700],
    },
  },
  colorMode: {
    classSuffix: "",
  },
  shadcn: {
    prefix: "",
    componentDir: "~/components/ui",
  },
  app: {
    head: {
      titleTemplate: "Nubo | Networked Utilities & Builtin Options",
    },
  },
})