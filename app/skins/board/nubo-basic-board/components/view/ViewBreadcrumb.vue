<template>
  <Breadcrumb class="font-title mb-2 mx-auto px-3">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <Breadcrumb>{{ BOARD_PREFIX[view.config.type] }}</Breadcrumb>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem
        ><BreadcrumbLink :href="`/board/${view.config.id}/page/1`">
          {{ view.config.id }}
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        {{ view.config.info }}
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<script setup lang="ts">
import { BOARD_PREFIX } from "~/types/board"
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const { view } = useNuboViewContext()
</script>
