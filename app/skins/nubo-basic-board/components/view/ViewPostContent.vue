<template>
  <div ref="contentElement" @click="handleContentClick" v-html="sanitizedContent"></div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner"

const props = defineProps<{ content: string }>()
const { sanitize } = useSanitize()
const contentElement = ref<HTMLElement>()
const sanitizedContent = computed(() => sanitize(props.content))

const renderCodeBlocks = async () => {
  await nextTick()
  const root = contentElement.value
  if (!root) return

  const codeBlocks = Array.from(root.querySelectorAll("pre > code"))
  await Promise.all(
    codeBlocks.map(async (codeBlock) => {
      const pre = codeBlock.parentElement
      if (!pre || pre.dataset.shiki === "true") return

      const language = Array.from(codeBlock.classList).find((name) => name.startsWith("language-")) || "text"
      const highlighted = await highlightCode(codeBlock.textContent || "", language)
      const template = document.createElement("template")
      template.innerHTML = highlighted.trim()
      const shikiPre = template.content.firstElementChild
      if (!(shikiPre instanceof HTMLElement)) return

      shikiPre.dataset.shiki = "true"
      shikiPre.classList.add("nubo-code-pre")

      const wrapper = document.createElement("div")
      wrapper.className = "nubo-code-block"
      wrapper.dataset.language = normalizeCodeLanguage(language)

      const toolbar = document.createElement("div")
      toolbar.className = "nubo-code-toolbar"

      const label = document.createElement("span")
      label.className = "nubo-code-language"
      label.textContent = getCodeLanguageLabel(language)

      const copy = document.createElement("button")
      copy.type = "button"
      copy.className = "nubo-code-copy"
      copy.dataset.codeCopy = "true"
      copy.setAttribute("aria-label", `${label.textContent} 코드 클립보드에 복사`)
      copy.textContent = "복사"

      toolbar.append(label, copy)
      wrapper.append(toolbar, shikiPre)
      pre.replaceWith(wrapper)
    }),
  )
}

const handleContentClick = async (event: MouseEvent) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const button = target.closest<HTMLButtonElement>("[data-code-copy]")
  if (!button) return

  const code = button.closest(".nubo-code-block")?.querySelector("pre code")?.textContent || ""
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    button.textContent = "복사됨"
    toast("✅ 코드를 클립보드에 복사했습니다")
    window.setTimeout(() => {
      button.textContent = "복사"
    }, 1600)
  } catch {
    toast("❌ 코드를 복사하지 못했습니다")
  }
}

onMounted(renderCodeBlocks)
watch(
  () => props.content,
  () => renderCodeBlocks(),
  { flush: "post" },
)
</script>
