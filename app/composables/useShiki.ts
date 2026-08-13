import type { HighlighterCore } from "shiki/core"

type SupportedLanguage =
  | "cpp"
  | "css"
  | "go"
  | "html"
  | "java"
  | "javascript"
  | "json"
  | "kotlin"
  | "php"
  | "python"
  | "rust"
  | "shellscript"
  | "text"
  | "typescript"
  | "vue"

const LANGUAGE_ALIASES: Record<string, SupportedLanguage> = {
  cpp: "cpp",
  css: "css",
  go: "go",
  html: "html",
  java: "java",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  kotlin: "kotlin",
  kt: "kotlin",
  php: "php",
  py: "python",
  python: "python",
  rs: "rust",
  rust: "rust",
  shell: "shellscript",
  sh: "shellscript",
  ts: "typescript",
  typescript: "typescript",
  vue: "vue",
}

let highlighterPromise: Promise<HighlighterCore> | undefined

const getHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
    ]).then(([{ createHighlighterCore }, { createJavaScriptRegexEngine }]) =>
      createHighlighterCore({
        themes: [import("@shikijs/themes/github-light"), import("@shikijs/themes/github-dark")],
        langs: [
          import("@shikijs/langs/cpp"),
          import("@shikijs/langs/css"),
          import("@shikijs/langs/go"),
          import("@shikijs/langs/html"),
          import("@shikijs/langs/java"),
          import("@shikijs/langs/javascript"),
          import("@shikijs/langs/json"),
          import("@shikijs/langs/kotlin"),
          import("@shikijs/langs/php"),
          import("@shikijs/langs/python"),
          import("@shikijs/langs/rust"),
          import("@shikijs/langs/shellscript"),
          import("@shikijs/langs/typescript"),
          import("@shikijs/langs/vue"),
        ],
        engine: createJavaScriptRegexEngine(),
      }),
    )
  }

  return highlighterPromise
}

export const normalizeCodeLanguage = (language: string): SupportedLanguage => {
  const normalized = language.toLowerCase().replace(/^language-/, "")
  return LANGUAGE_ALIASES[normalized] || "text"
}

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  cpp: "C++",
  css: "CSS",
  go: "Go",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  json: "JSON",
  kotlin: "Kotlin",
  php: "PHP",
  python: "Python",
  rust: "Rust",
  shellscript: "Shell",
  text: "Text",
  typescript: "TypeScript",
  vue: "Vue",
}

export const getCodeLanguageLabel = (language: string) => LANGUAGE_LABELS[normalizeCodeLanguage(language)]

export const highlightCode = async (code: string, language: string): Promise<string> => {
  const highlighter = await getHighlighter()

  return highlighter.codeToHtml(code, {
    lang: normalizeCodeLanguage(language),
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
  })
}
