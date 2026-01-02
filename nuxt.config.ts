import tailwindcss from "@tailwindcss/vite"
import { resolve } from "pathe"

const GOAPI = `http://localhost:${process.env.NUXT_PUBLIC_GOAPI_PORT || "3006"}/goapi` // GOAPI 백엔드 주소

export default defineNuxtConfig({
  srcDir: "app/",
  runtimeConfig: {
    apiBaseInternal: GOAPI,
    public: {
      apiBase: "/api",
      goapi: GOAPI,
      version: process.env.NUXT_PUBLIC_VERSION || "v2.0.0",
      url: process.env.NUXT_PUBLIC_DOMAIN || "https://nubohub.org",
      title: process.env.NUXT_PUBLIC_TITLE || "The NUBO | Nuxt4 based Board",
      imageSize: {
        profile: process.env.NUXT_PUBLIC_PROFILE_SIZE || "256",
        contentInsert: process.env.NUXT_PUBLIC_CONTENT_INSERT_SIZE || "1024",
        thumbnail: process.env.NUXT_PUBLIC_THUMBNAIL_SIZE || "512",
      },
      fileSize: process.env.NUXT_PUBLIC_FILE_SIZE_LIMIT || "104857600",
      accessTokenHours: process.env.NUXT_PUBLIC_ACCESS_HOURS || "2",
      refreshTokenDays: process.env.NUXT_PUBLIC_REFRESH_DAYS || "7",
      adminId: process.env.NUXT_PUBLIC_ADMIN_ID || "example-admin@nubohub.org",
      defaultSkins: {
        layout: "nubo-basic-layout",
        home: "nubo-basic-home",
        login: "nubo-basic-login",
        profile: "nubo-basic-profile",
        board: "nubo-basic-board",
        privacy: "nubo-basic-privacy",
        error: "nubo-basic-error",
      },
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
    "@nuxtjs/color-mode",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],
  fonts: {
    families: [
      { name: "Inter", provider: "google" },
      { name: "JetBrains Mono", provider: "google" },
      { name: "Pretendard", provider: "local" },
    ],
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
      titleTemplate: "nubo | a new unified board",
    },
  },
  nitro: {
    publicAssets: [{ baseURL: "/upload", dir: resolve(process.cwd(), "upload") }],
  },
})
