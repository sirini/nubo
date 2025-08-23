<template>
  <Breadcrumb class="font-title mb-2">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <Breadcrumb href="#">{{ BOARD_PREFIX[config.type] }}</Breadcrumb>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem
        ><BreadcrumbLink :href="`/${BOARD_PREFIX[config.type]}/${config.id}/page/1`">
          {{ config.id }}
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        {{ config.info }}
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<script setup lang="ts">
import { BOARD_PREFIX, type BoardConfig } from "~/types/board"

const props = defineProps<{
  config: BoardConfig
}>()
</script>
