<template>
  <Breadcrumb class="font-title mb-2 mx-auto px-3">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <Breadcrumb>{{ BOARD_PREFIX[config.type] }}</Breadcrumb>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem
        ><BreadcrumbLink :href="`/board/${config.id}/page/1`">
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
import { BOARD_PREFIX } from "~/types/board"
import { useNuboViewContext } from "~/providers/contexts/view"

const { config } = useNuboViewContext()
</script>
