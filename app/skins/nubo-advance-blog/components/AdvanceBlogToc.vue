<template>
  <aside v-if="headers.length" class="hidden xl:block">
    <div class="sticky top-28">
      <p class="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        In this story
      </p>
      <nav aria-label="글 목차" class="space-y-1 border-l border-border/70 pl-4">
        <a
          v-for="header in headers"
          :key="header.id"
          :href="`#${header.id}`"
          class="block py-1 text-sm leading-6 transition-colors hover:text-primary"
          :class="[
            header.level === 3 ? 'pl-3 text-xs' : '',
            activeId === header.id ? 'font-semibold text-primary' : 'text-muted-foreground',
          ]"
          :aria-current="activeId === header.id ? 'location' : undefined"
          >{{ header.text }}</a
        >
      </nav>
    </div>
  </aside>
</template>
<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import type { TableOfContent } from "~/types/board"
const { makeTableOfContents } = useNuboViewContext()
const headers = ref<TableOfContent[]>([])
const activeId = ref("")
let elements: HTMLElement[] = []
let controller: AbortController | undefined
const update = () => {
  if (!elements.length) return
  let active = elements[0]
  for (const heading of elements) {
    if (heading.getBoundingClientRect().top > 140) break
    active = heading
  }
  activeId.value = active?.id || ""
}
onMounted(() => {
  headers.value = makeTableOfContents()
  elements = headers.value
    .map((item) => document.getElementById(item.id))
    .filter((item): item is HTMLElement => item instanceof HTMLElement)
  controller = new AbortController()
  window.addEventListener("scroll", update, { passive: true, signal: controller.signal })
  update()
})
onBeforeUnmount(() => controller?.abort())
</script>
