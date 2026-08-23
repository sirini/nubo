<template>
  <Breadcrumb class="mx-auto mb-5 px-1 text-xs text-muted-foreground">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">홈</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <Breadcrumb>{{ BOARD_LABEL[config.type] }}</Breadcrumb>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem
        ><BreadcrumbLink :href="`/board/${config.id}/page/1`">
          {{ recoverChars(config.name) }}
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem class="min-w-0">
        <span class="block max-w-64 truncate">{{ recoverChars(view.post.title) }}</span>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<script setup lang="ts">
import { BOARD } from "~/types/board"
import { useNuboViewContext } from "~/providers/contexts/view"

const { config, view } = useNuboViewContext()

const BOARD_LABEL: Record<number, string> = {
  [BOARD.DEFAULT]: "게시판",
  [BOARD.GALLERY]: "갤러리",
  [BOARD.BLOG]: "블로그",
  [BOARD.WEBZINE]: "게시판",
  [BOARD.TRADE]: "장터",
}
</script>
