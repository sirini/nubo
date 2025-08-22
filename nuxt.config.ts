import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  runtimeConfig: {
    apiBaseInternal: "http://localhost:3003/goapi", // GOAPI 백엔드 주소
    public: {
      apiBase: "/api",
    },
  },
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
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
  ],
  googleFonts: {
    display: "swap",
    preconnect: true,
    download: false,
    families: {
      Inter: [200, 400, 500, 600, 700],
      "Google Sans Code": [400, 500, 600, 700],
    },
  },
  shadcn: {
    prefix: "",
    componentDir: "./components/ui",
  },
  app: {
    head: {
      titleTemplate: "Nubo | Networked Utilities & Builtin Options",
    },
  },
})
