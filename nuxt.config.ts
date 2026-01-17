import tailwindcss from "@tailwindcss/vite"
import { resolve } from "pathe"

const env = process.env
const GOAPI_PORT = env.NUXT_PUBLIC_GOAPI_PORT || "3006"
const GOAPI_BASE = env.NUXT_PUBLIC_GOAPI_BASE || "goapi"
const GOAPI_URL = `http://127.0.0.1:${GOAPI_PORT}/${GOAPI_BASE}`

// 기본 스킨 설정
const defaultSkins = {
  admin: "nubo-basic-admin",
  layout: "nubo-basic-layout",
  home: "nubo-basic-home",
  login: "nubo-basic-login",
  profile: "nubo-basic-profile",
  board: "nubo-basic-board",
  privacy: "nubo-basic-privacy",
  error: "nubo-basic-error",
}

export default defineNuxtConfig({
  srcDir: "app/",
  compatibilityDate: "2025-05-15",
  devtools: { enabled: false },

  // 실행 시 환경 변수
  runtimeConfig: {
    apiBaseInternal: GOAPI_URL, // SSR에서 사용할 서버 측 주소
    public: {
      apiBase: "/api",
      goapi: GOAPI_URL,
      goapiBase: GOAPI_BASE,
      version: env.NUXT_PUBLIC_VERSION || "v2.0.0",
      domain: env.NUXT_PUBLIC_DOMAIN || "https://nubohub.org",
      title: env.NUXT_PUBLIC_TITLE || "The NUBO | Nuxt4 based Board",
      adminId: env.NUXT_PUBLIC_ADMIN_ID || "example-admin@nubohub.org",
      imageSize: {
        profile: env.NUXT_PUBLIC_PROFILE_SIZE || "256",
        contentInsert: env.NUXT_PUBLIC_CONTENT_INSERT_SIZE || "1024",
        thumbnail: env.NUXT_PUBLIC_THUMBNAIL_SIZE || "512",
      },
      fileSize: env.NUXT_PUBLIC_FILE_SIZE_LIMIT || "104857600",
      auth: {
        accessTokenHours: env.NUXT_PUBLIC_ACCESS_HOURS || "2",
        refreshTokenDays: env.NUXT_PUBLIC_REFRESH_DAYS || "7",
      },
      skins: defaultSkins,
    },
  },

  // UI 스타일
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  colorMode: { classSuffix: "" },
  shadcn: { prefix: "", componentDir: "~/components/ui" },

  // Modules Configuration
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

  // 폰트
  fonts: {
    families: [
      { name: "Inter", provider: "google" },
      { name: "JetBrains Mono", provider: "google" },
      { name: "Pretendard", provider: "local" },
    ],
  },
  app: {
    head: {
      titleTemplate: "nubo | a new unified board",
    },
  },

  // 업로드 폴더 경로 설정
  nitro: {
    publicAssets:
      process.env.NODE_ENV === "development"
        ? [
            {
              baseURL: "/upload",
              dir: resolve("./upload"),
              fallthrough: true,
            },
          ]
        : [],
  },
})
