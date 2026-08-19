import tailwindcss from "@tailwindcss/vite"
import { resolve } from "pathe"

const env = process.env
const GOAPI_PORT = env.NUXT_PUBLIC_GOAPI_PORT || "3006"
const GOAPI_PATH = env.NUXT_PUBLIC_GOAPI_BASE || env.NUXT_PUBLIC_GOAPI_PATH || "goapi"
const GOAPI_URL = env.NUXT_API_BASE_INTERNAL || `http://127.0.0.1:${GOAPI_PORT}/${GOAPI_PATH}`

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

  // 실행 시 환경 변수 (env.NUXT_PUBLIC_ 으로 시작하는 변수들은 .env 파일에서 참조합니다)
  runtimeConfig: {
    apiBaseInternal: GOAPI_URL, // SSR에서 사용할 서버 측 주소
    public: {
      apiBase: "/api",
      goapiBase: GOAPI_PATH,
      version: env.NUXT_PUBLIC_VERSION || "v1.2.7",
      domain: env.NUXT_PUBLIC_DOMAIN || "https://nubohub.org",
      title: env.NUXT_PUBLIC_TITLE || "NUBO | A New Unified Board",
      adminId: env.NUXT_PUBLIC_ADMIN_ID || "example-admin@nubohub.org",
      // env.sample의 이름과 같은 1단계 키를 사용해야 prebuilt 실행 시 값이 덮어써진다.
      profileSize: env.NUXT_PUBLIC_PROFILE_SIZE || "256",
      contentInsertSize: env.NUXT_PUBLIC_CONTENT_INSERT_SIZE || "1024",
      thumbnailSize: env.NUXT_PUBLIC_THUMBNAIL_SIZE || "512",
      fullSize: env.NUXT_PUBLIC_FULL_SIZE || "2048",
      fileSizeLimit: env.NUXT_PUBLIC_FILE_SIZE_LIMIT || "104857600",
      accessHours: env.NUXT_PUBLIC_ACCESS_HOURS || "2",
      refreshDays: env.NUXT_PUBLIC_REFRESH_DAYS || "7",
      skins: defaultSkins,
    },
  },

  // UI 스타일
  css: ["~/assets/css/tailwind.css", "~/assets/css/font.css"],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        "clsx",
        "tailwind-merge",
        "vue-sonner",
        "lucide-vue-next",
        "class-variance-authority",
        "reka-ui",
        "embla-carousel-vue",
        "@tiptap/vue-3",
        "@tiptap/extension-blockquote",
        "@tiptap/extension-bold",
        "@tiptap/extension-bullet-list",
        "@tiptap/extension-code",
        "@tiptap/extension-code-block",
        "@tiptap/extension-color",
        "@tiptap/extension-document",
        "@tiptap/extension-dropcursor",
        "@tiptap/extension-gapcursor",
        "@tiptap/extension-hard-break",
        "@tiptap/extension-heading",
        "@tiptap/extension-highlight",
        "@tiptap/extension-history",
        "@tiptap/extension-horizontal-rule",
        "@tiptap/extension-image",
        "@tiptap/extension-italic",
        "@tiptap/extension-link",
        "@tiptap/extension-list-item",
        "@tiptap/extension-ordered-list",
        "@tiptap/extension-paragraph",
        "@tiptap/extension-strike",
        "@tiptap/extension-table",
        "@tiptap/extension-table-cell",
        "@tiptap/extension-table-header",
        "@tiptap/extension-table-row",
        "@tiptap/extension-text",
        "@tiptap/extension-text-style",
        "@tiptap/extension-typography",
        "@tiptap/extension-youtube",
        "isomorphic-dompurify",
        "@vee-validate/zod",
        "vee-validate",
        "zod",
        "@unovis/vue",
        "vaul-vue",
      ],
    },
  },
  colorMode: {
    preference: "light",
    fallback: "light",
    classSuffix: "",
    storageKey: "nubo-color-mode",
  },
  shadcn: { prefix: "", componentDir: "~/components/ui" },

  // Modules Configuration
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@nuxt/scripts",
    "shadcn-nuxt",
    "@nuxtjs/color-mode",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],

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
