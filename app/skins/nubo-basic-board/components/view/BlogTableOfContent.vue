<template>
  <aside v-if="headers.length" class="sticky top-24 hidden h-fit lg:col-span-3 lg:block">
    <h2 class="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">목차</h2>
    <nav class="space-y-1 border-l border-border/70 pl-4">
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
        <a :href="`#${header.id}`" class="block transition-colors">{{ header.text }}</a>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import type { TableOfContent } from "~/types/board"

const { makeTableOfContents } = useNuboViewContext()
const headers = ref<TableOfContent[]>([])
const activeHeaderId = ref<string>("")
let observer: IntersectionObserver | undefined

onMounted(() => {
  headers.value = makeTableOfContents()

  // 현재 보고 있는 목차 강조하기
  observer = new IntersectionObserver(
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
    if (el) observer?.observe(el)
  })
})

onBeforeUnmount(() => observer?.disconnect())
</script>
