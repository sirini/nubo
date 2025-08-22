import { type Config } from "tailwindcss"

const config: Config = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Google Sans Code", "Noto Sans KR"],
        heading: ["Inter"],
      },
    },
  },
  plugins: [],
}

export default config
