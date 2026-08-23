<template>
  <Carousel
    v-if="view.images.length > 0"
    class="relative flex h-full w-full flex-col justify-center"
    @init-api="setApi"
  >
    <CarouselContent class="h-full">
      <CarouselItem
        v-for="(img, index) in view.images"
        :key="index"
        class="flex h-full items-center justify-center"
      >
        <img
          :src="getPreviewImage(img.thumbnail.large)"
          :alt="`${recoverChars(view.post.title)} 이미지 ${index + 1}`"
          class="max-h-[calc(100dvh-8rem)] max-w-full select-none object-contain"
        />
      </CarouselItem>
    </CarouselContent>

    <CommonVTooltip content="이전 이미지를 봅니다">
      <CarouselPrevious class="hidden sm:flex left-3 cursor-pointer"
    /></CommonVTooltip>

    <CommonVTooltip content="다음 이미지를 봅니다">
      <CarouselNext class="hidden sm:flex right-3 cursor-pointer"
    /></CommonVTooltip>

    <div
      v-if="count > 1"
      class="absolute bottom-5 left-1/2 flex -translate-x-1/2 rounded-full bg-black/45 px-2 backdrop-blur-md"
    >
      <CommonVTooltip
        v-for="(i, idx) in count"
        :key="idx"
        :content="`${idx + 1}번째 이미지를 봅니다 (총 ${count}장)`"
      >
        <DotIcon
          class="size-6 cursor-pointer text-white/40 transition-colors duration-300"
          :class="idx === imgIdx ? 'text-white' : ''"
          :aria-label="`${idx + 1}번째 이미지`"
          @click="api?.scrollTo(idx)"
      /></CommonVTooltip>
    </div>
  </Carousel>

  <img
    v-else-if="view.post.cover"
    :src="getPreviewImage(view.post.cover)"
    :alt="recoverChars(view.post.title)"
    class="max-h-[calc(100dvh-8rem)] max-w-full select-none object-contain"
  />

  <div v-else class="text-media-foreground/55">이미지가 없습니다</div>
</template>

<script setup lang="ts">
import { DotIcon } from "lucide-vue-next"
import type { CarouselApi } from "~/components/ui/carousel"
import { useNuboViewContext } from "~/providers/contexts/view"

// imgIdx는 provider와 양방향으로 연결되어 이미지와 EXIF 패널이 같은 현재 위치를 공유합니다.
const { view, imgIdx } = useNuboViewContext()

const api = ref<CarouselApi>()
const count = ref<number>(0)

// API 초기화 혹은 변경 시 이벤트 리스너 연결
const setApi = (val: CarouselApi) => {
  api.value = val
}

// 이미지 카드 컴포넌트 변경 감지
watch(api, (api) => {
  if (!api) return
  imgIdx.value = api.selectedScrollSnap()
  count.value = api.scrollSnapList().length

  api.on("select", () => {
    imgIdx.value = api.selectedScrollSnap()
  })
})
</script>
