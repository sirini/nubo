<template>
  <div class="space-y-3 rounded-2xl border border-border/70 bg-card/55 p-4">
    <div class="grid grid-cols-2 gap-4 text-xs">
      <div class="space-y-1">
        <span class="text-muted-foreground block uppercase">Camera</span>
        <span class="font-semibold text-foreground">{{
          view.images[imgIdx]?.exif.make || "Unknown"
        }}</span>
      </div>

      <div class="space-y-1">
        <span class="text-muted-foreground block uppercase">Model</span>
        <span class="font-semibold text-foreground">{{
          view.images[imgIdx]?.exif.model || "Unknown"
        }}</span>
      </div>
    </div>
    <Separator />
    <div class="flex flex-wrap justify-between gap-3 font-mono text-xs text-muted-foreground">
      <span>{{ view.images[imgIdx]?.exif.focalLength || "? " }}mm</span>
      <span>f/{{ (view.images[imgIdx]?.exif.aperture || 0) / 100 }}</span>
      <span>{{ (view.images[imgIdx]?.exif.exposure || 0) / 1000 }}ms</span>
      <span>ISO {{ view.images[imgIdx]?.exif.iso || 0 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"

// carousel과 같은 imgIdx를 읽어 현재 사진의 EXIF만 표시합니다.
const { view, imgIdx } = useNuboViewContext()
</script>
