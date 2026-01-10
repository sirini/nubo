<template>
  <aside class="hidden lg:block lg:col-span-3 sticky top-24 h-fit">
    <h4 class="text-sm font-bold uppercase tracking-widset text-muted-foreground mb-4">목차</h4>
    <nav class="space-y-2">
      <div
        v-for="header of headers"
        :key="header.id"
        :class="[
          'transition-colors hover:text-primary',
          activeHeaderId === header.id
            ? 'border-primary text-primary font-bold'
            : header.level === 3
            ? 'pl-4 text-xs'
            : header.level === 2
            ? 'pl-2 text-sm'
            : 'text-sm',
        ]"
      >
        <a :href="`#${header.id}`" class="block transition-colors">{{ header.text }}</a>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import type { TableOfContent } from "~/types/board"
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const { makeTableOfContents, updateReadingProgress } = useNuboViewContext()
const headers = ref<TableOfContent[]>([])
const activeHeaderId = ref<string>("")

onMounted(() => {
  headers.value = makeTableOfContents()

  // 현재 보고 있는 목차 강조하기
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeHeaderId.value = entry.target.id
        }
      })
    },
    {
      rootMargin: "-10% 0px -80% 0px",
      threshold: 1.0,
    },
  )

  // 각 헤더 요소들 감시 시작
  headers.value.forEach((header) => {
    const el = document.getElementById(header.id)
    if (el) observer.observe(el)
  })
})
</script>
