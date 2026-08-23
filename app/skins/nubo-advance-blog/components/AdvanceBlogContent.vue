<template>
  <!-- eslint-disable vue/no-v-html -- 게시글 HTML은 useSanitize()로 정제합니다. -->
  <div
    ref="contentElement"
    class="nubo advance-blog-prose text-[1.08rem] leading-[1.95] sm:text-[1.16rem]"
    @click="handleContentClick"
    v-html="sanitizedContent"
  ></div>
  <!-- eslint-enable vue/no-v-html -->
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
  await Promise.all(
    [...root.querySelectorAll("pre > code")].map(async (codeBlock) => {
      const pre = codeBlock.parentElement
      if (!pre || pre.dataset.shiki === "true") return
      const language =
        [...codeBlock.classList].find((name) => name.startsWith("language-")) || "text"
      const highlighted = await highlightCode(codeBlock.textContent || "", language)
      const template = document.createElement("template")
      template.innerHTML = highlighted.trim()
      const rendered = template.content.firstElementChild
      if (!(rendered instanceof HTMLElement)) return
      rendered.dataset.shiki = "true"
      rendered.classList.add("nubo-code-pre")
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
      copy.setAttribute("aria-label", `${label.textContent} 코드 복사`)
      copy.textContent = "복사"
      toolbar.append(label, copy)
      wrapper.append(toolbar, rendered)
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
    window.setTimeout(() => {
      button.textContent = "복사"
    }, 1600)
  } catch {
    toast("❌ 코드를 복사하지 못했습니다")
  }
}
onMounted(renderCodeBlocks)
watch(() => props.content, renderCodeBlocks, { flush: "post" })
</script>

<style scoped>
.advance-blog-prose :deep(p) {
  margin-block: 1.4em;
}
.advance-blog-prose :deep(h1),
.advance-blog-prose :deep(h2),
.advance-blog-prose :deep(h3) {
  scroll-margin-top: 7rem;
  letter-spacing: -0.035em;
  line-height: 1.3;
}
.advance-blog-prose :deep(h1) {
  margin-top: 2.6em;
  font-size: 2rem;
}
.advance-blog-prose :deep(h2) {
  margin-top: 2.3em;
  font-size: 1.65rem;
}
.advance-blog-prose :deep(h3) {
  margin-top: 2em;
  font-size: 1.35rem;
}
.advance-blog-prose :deep(blockquote) {
  margin-block: 2em;
  border-left: 3px solid color-mix(in oklab, var(--primary) 72%, var(--border));
  padding-left: 1.35rem;
  color: hsl(var(--muted-foreground));
  font-size: 1.12em;
}
.advance-blog-prose :deep(img) {
  margin: 2.4rem auto;
  max-height: 80dvh;
  border-radius: 0.75rem;
  object-fit: contain;
}
</style>
