<template>
  <Carousel @init-api="setApi" class="w-full relative group border-b shadow-lg">
    <CarouselContent>
      <CarouselItem v-for="(img, index) in view.images" :key="index">
        <div class="p-1">
          <div class="overflow-hidden flex items-center justify-center relative rounded-lg">
            <img
              :src="img.thumbnail.large"
              alt="Attached image"
              class="w-full h-full"
              loading="lazy"
            />
          </div>
          <div v-if="img.exif.model.length > 0" class="text-xs text-muted-foreground p-3 leading-5">
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

    <div class="flex justify-center my-3">
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
import { DotIcon } from "lucide-vue-next"
import type { CarouselApi } from "~/components/ui/carousel"
import { useNuboViewContext } from "~/types/nubo-skin-keys"

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
