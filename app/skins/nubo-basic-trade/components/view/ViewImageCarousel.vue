<template>
  <Carousel class="group relative w-full border-b border-border/70 bg-media" @init-api="setApi">
    <CarouselContent>
      <CarouselItem v-for="(img, index) in view.images" :key="index">
        <div>
          <div class="relative flex max-h-[70vh] min-h-72 items-center justify-center overflow-hidden">
            <img
              :src="img.thumbnail.large"
              :alt="`${recoverChars(view.post.title)} 이미지 ${index + 1}`"
              class="max-h-[70vh] w-full object-contain"
              loading="lazy"
            />
          </div>
          <div
            v-if="img.exif.model.length > 0"
            class="bg-background/90 px-5 py-3 text-xs leading-5 text-muted-foreground sm:px-8"
          >
            제조사: {{ img.exif.make }} · 모델명: {{ img.exif.model }} · 초점 거리:
            {{ img.exif.focalLength }}mm · 조리개: f{{ img.exif.aperture / 100 }} · 노출:
            {{ img.exif.exposure / 1000 }}ms · ISO: {{ img.exif.iso }} · 원본 크기:
            {{ img.exif.width }} x {{ img.exif.height }} · 촬영일:
            {{ dateFull(img.exif.date) }}
          </div>
        </div>
      </CarouselItem>
    </CarouselContent>

    <CommonVTooltip content="이전 이미지를 봅니다">
      <CarouselPrevious class="hidden sm:flex left-3 cursor-pointer"
    /></CommonVTooltip>

    <CommonVTooltip content="다음 이미지를 봅니다">
      <CarouselNext class="hidden sm:flex right-3 cursor-pointer"
    /></CommonVTooltip>

    <nav
      v-if="count > 1"
      class="flex items-center justify-center gap-0.5 border-t border-border/60 bg-surface-subtle/70 px-3 py-1.5"
      aria-label="첨부 이미지 페이지"
    >
      <CommonVTooltip
        v-for="(i, idx) in count"
        :key="idx"
        :content="`${idx + 1}번째 이미지를 봅니다 (총 ${count}장)`"
      >
        <button
          type="button"
          class="flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground/45 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="idx + 1 === current ? 'text-primary' : ''"
          :aria-current="idx + 1 === current ? 'page' : undefined"
          :aria-label="`${idx + 1}번째 이미지`"
          @click="api?.scrollTo(idx)"
        >
          <DotIcon class="size-6" />
        </button>
      </CommonVTooltip>
    </nav>
  </Carousel>
</template>

<script setup lang="ts">
import { DotIcon } from "lucide-vue-next"
import type { CarouselApi } from "~/components/ui/carousel"
import { useNuboViewContext } from "~/providers/contexts/view"

const api = ref<CarouselApi>()
const current = ref<number>(0)
const count = ref<number>(0)

// API 초기화 혹은 변경 시 이벤트 리스너 연결
const setApi = (val: CarouselApi) => {
  api.value = val
}

// 이미지 카드 컴포넌트 변경 감지
watch(api, (api) => {
  if (!api) return
  count.value = api.scrollSnapList().length
  current.value = api.selectedScrollSnap() + 1

  api.on("select", () => {
    current.value = api.selectedScrollSnap() + 1
  })
})

const { view } = useNuboViewContext()
</script>
