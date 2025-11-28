// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs"

export default withNuxt()

module.exports = {
  rules: {
    "vue/html-self-closing": [
      "error",
      {
        html: {
          void: "always",
          normal: "never",
          component: "always",
        },
        svg: "always",
        math: "always",
      },
    ],
  },
}
