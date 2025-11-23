<template>
  <Carousel @init-api="setApi" class="w-full relative group">
    <CarouselContent>
      <CarouselItem v-for="(img, index) in images" :key="index">
        <div class="p-1">
          <div
            class="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative"
          >
            <img
              :src="img.thumbnail.large"
              alt="Attached image"
              class="w-full h-full"
              loading="lazy"
            />
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

    <div class="flex justify-center gap-2 mt-2">
      <CommonVTooltip
        v-for="(i, idx) in count"
        :key="idx"
        :content="`${idx + 1}번째 이미지를 봅니다 (총 ${count}장)`"
      >
        <DotIcon
          class="w-6 h-6 transition-colors duration-300 cursor-pointer"
          :class="idx + 1 === current ? 'text-accent-foreground' : 'text-accent'"
          @click="api?.scrollTo(idx)"
          aria-label="Go to slide"
      /></CommonVTooltip>
    </div>
  </Carousel>
</template>

<script setup lang="ts">
import type { BoardAttachedImage } from "~/types/board"
import type { CarouselApi } from "../ui/carousel"
import Carousel from "../ui/carousel/Carousel.vue"
import CarouselContent from "../ui/carousel/CarouselContent.vue"
import CarouselItem from "../ui/carousel/CarouselItem.vue"
import CarouselNext from "../ui/carousel/CarouselNext.vue"
import CarouselPrevious from "../ui/carousel/CarouselPrevious.vue"
import { DotIcon } from "lucide-vue-next"

const api = ref<CarouselApi>()
const current = ref<number>(0)
const count = ref<number>(0)

// API 초기화 혹은 변경 시 이벤트 리스너 연결
const setApi = (val: CarouselApi) => {
  api.value = val
}

watch(api, (api) => {
  if (!api) return
  count.value = api.scrollSnapList().length
  current.value = api.selectedScrollSnap() + 1

  api.on("select", () => {
    current.value = api.selectedScrollSnap() + 1
  })
})

defineProps<{ images: BoardAttachedImage[] }>()
</script>
