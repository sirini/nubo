<template>
  <Card class="md:col-span-1 md:row-span-1 overflow-hidden">
    <CardHeader class="border-b">
      <CardTitle class="flex items-center gap-2 font-medium"><slot /> {{ title }}</CardTitle>
    </CardHeader>
    <CardContent class="flex items-center justify-center h-20 text-3xl font-medium mb-2">
      {{ content }}
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
defineProps<{ title: string; content: string }>()
</script>
