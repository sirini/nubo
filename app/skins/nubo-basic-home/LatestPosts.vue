<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <div v-if="!isSearching" class="mb-10 border-b border-border/70 pb-7 sm:mb-14">
      <div class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Community</div>
      <h1 class="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">새로운 이야기</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        지금 커뮤니티에서 나누고 있는 이야기들을 만나보세요.
      </p>

      <div class="mt-6 flex items-center gap-2">
        <CommonVTooltip content="커뮤니티 빌더 NUBO 프로젝트를 GitHub에서 만나보세요">
          <Button
            variant="default"
            class="cursor-pointer flex items-center gap-1.5"
            size="lg"
            @click="move('https://github.com/sirini/nubo')"
          >
            <GitBranchIcon class="w-4 h-4" />
            <span>NUBO</span>
          </Button>
        </CommonVTooltip>

        <CommonVTooltip content="NUBO를 위한 고성능 백엔드 엔진, GOAPI를 GitHub에서 만나보세요">
          <Button
            variant="outline"
            class="cursor-pointer flex items-center gap-1.5"
            size="lg"
            @click="move('https://github.com/sirini/goapi')"
          >
            <BinaryIcon class="w-4 h-4" />
            <span>GOAPI</span>
          </Button>
        </CommonVTooltip>

        <CommonVTooltip content="NUBO로 만들어진 사진 커뮤니티 SENSTA를 만나보세요">
          <Button
            variant="outline"
            class="cursor-pointer flex items-center gap-1.5"
            size="lg"
            @click="move('https://sensta.me')"
          >
            <CameraIcon class="w-4 h-4" />
            <span>GOAPI</span>
          </Button>
        </CommonVTooltip>
      </div>
    </div>

    <HomeGroupedPostCard v-if="!isSearching" />
    <HomeSearchedPostCard v-else />

    <div ref="scrollObserverRef" class="py-6"></div>
  </section>
</template>

<script setup lang="ts">
import { BinaryIcon, GitBranchIcon } from "lucide-vue-next"
import HomeGroupedPostCard from "./components/HomeGroupedPostCard.vue"
import HomeSearchedPostCard from "./components/HomeSearchedPostCard.vue"

const route = useRoute()
const isSearching = computed(
  () => route.params.keyword !== undefined && route.params.keyword.length > 1,
)
const move = (url: string) => {
  window.location.href = url
}
</script>
