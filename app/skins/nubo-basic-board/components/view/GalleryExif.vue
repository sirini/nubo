<template>
  <div class="rounded-lg border bg-zinc-900/50 p-4 space-y-3">
    <div class="grid grid-cols-2 gap-4 text-xs">
      <div class="space-y-1">
        <span class="text-muted-foreground block uppercase">Camera</span>
        <span class="font-semibold text-zinc-200">{{
          view.images[imgIdx]?.exif.make || "Unknown"
        }}</span>
      </div>

      <div class="space-y-1">
        <span class="text-muted-foreground block uppercase">Model</span>
        <span class="font-semibold text-zinc-200">{{
          view.images[imgIdx]?.exif.model || "Unknown"
        }}</span>
      </div>
    </div>
    <Separator class="bg-zinc-800" />
    <div class="flex justify-between text-sm font-mono text-zinc-400">
      <span>{{ view.images[imgIdx]?.exif.focalLength || "? " }}mm</span>
      <span>f/{{ (view.images[imgIdx]?.exif.aperture || 0) / 100 }}</span>
      <span>{{ (view.images[imgIdx]?.exif.exposure || 0) / 1000 }}ms</span>
      <span>ISO {{ view.images[imgIdx]?.exif.iso || 0 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"

const { view, imgIdx } = useNuboViewContext()
</script>
