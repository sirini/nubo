<template>
  <aside
    v-if="headers.length"
    class="sticky top-24 hidden h-fit max-h-[calc(100dvh-7rem)] self-start overflow-y-auto pr-2 lg:col-span-3 lg:block"
  >
    <h2 class="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">목차</h2>
    <nav aria-label="게시글 목차" class="space-y-1 border-l border-border/70 pl-4">
      <div
        v-for="header of headers"
        :key="header.id"
        :class="[
          'border-l-2 border-transparent py-1 transition-colors hover:text-primary',
          activeHeaderId === header.id
            ? '-ml-[17px] border-primary pl-[15px] font-semibold text-primary'
            : header.level === 3
              ? 'pl-4 text-xs'
              : header.level === 2
                ? 'pl-2 text-sm'
                : 'text-sm',
        ]"
      >
        <a
          :href="`#${header.id}`"
          :aria-current="activeHeaderId === header.id ? 'location' : undefined"
          class="block transition-colors"
          >{{ header.text }}</a
        >
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import type { TableOfContent } from "~/types/board"

// 본문 렌더링 뒤 `.nubo` 안의 h1~h3을 읽어 안정적인 anchor id와 목차를 만듭니다.
const { makeTableOfContents } = useNuboViewContext()
const headers = ref<TableOfContent[]>([])
const activeHeaderId = ref<string>("")
let headingElements: HTMLElement[] = []
let scrollController: AbortController | undefined
let animationFrame = 0

const updateActiveHeader = () => {
  animationFrame = 0
  if (!headingElements.length) return

  const activationLine = 144
  let active = headingElements[0]
  if (!active) return

  for (const heading of headingElements) {
    if (heading.getBoundingClientRect().top > activationLine) break
    active = heading
  }

  activeHeaderId.value = active.id
}

const scheduleActiveHeaderUpdate = () => {
  if (animationFrame) return
  animationFrame = window.requestAnimationFrame(updateActiveHeader)
}

onMounted(() => {
  headers.value = makeTableOfContents()
  headingElements = headers.value
    .map((header) => document.getElementById(header.id))
    .filter((element): element is HTMLElement => element instanceof HTMLElement)

  scrollController = new AbortController()
  window.addEventListener("scroll", scheduleActiveHeaderUpdate, {
    passive: true,
    signal: scrollController.signal,
  })
  window.addEventListener("resize", scheduleActiveHeaderUpdate, {
    passive: true,
    signal: scrollController.signal,
  })
  updateActiveHeader()
})

onBeforeUnmount(() => {
  scrollController?.abort()
  if (animationFrame) window.cancelAnimationFrame(animationFrame)
})
</script>
