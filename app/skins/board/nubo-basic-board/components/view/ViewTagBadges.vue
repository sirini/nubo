<template>
  <div>
    <Badge v-for="(tag, index) in view.tags" :key="index" variant="secondary" class="mt-2 mr-2">
      <HashIcon />
      {{ tag.name }}
    </Badge>
  </div>
</template>

<script setup lang="ts">
import { HashIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view } = useNuboViewContext()
</script>
