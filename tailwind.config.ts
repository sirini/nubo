import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.{vue,js,ts}",
    "./pages/**/*.{vue,js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        logo: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config
