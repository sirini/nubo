<template>
  <div ref="contentElement" v-html="sanitizedContent"></div>
</template>

<script setup lang="ts">
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
      pre.replaceWith(shikiPre)
    }),
  )
}

onMounted(renderCodeBlocks)
watch(
  () => props.content,
  () => renderCodeBlocks(),
  { flush: "post" },
)
</script>
