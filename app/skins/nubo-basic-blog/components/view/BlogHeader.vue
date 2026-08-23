<template>
  <header class="relative min-h-[28rem] w-full overflow-hidden rounded-t-2xl bg-media sm:min-h-[34rem]">
    <img
      v-if="coverImage"
      :src="coverImage"
      :alt="recoverChars(view.post.title)"
      class="absolute inset-0 h-full w-full select-none object-cover"
    />
    <div class="absolute inset-0 bg-linear-to-t from-black/90 via-black/35 to-black/10"></div>

    <div class="absolute inset-x-0 bottom-0 pb-8 sm:pb-12">
      <div class="mx-auto max-w-5xl px-5 sm:px-8">
        <Badge
          v-if="config.useCategory"
          variant="outline"
          class="mb-4 border-white/25 bg-black/20 text-sm text-white backdrop-blur-sm"
        >
          {{ recoverChars(view.post.category.name) }}
        </Badge>

        <div class="mb-6 break-keep text-white">
          <h1 class="text-3xl font-semibold leading-tight tracking-[-0.04em] drop-shadow-lg sm:text-5xl">
            {{ recoverChars(view.post.title) }}
          </h1>
          <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/70 sm:text-sm">
            <span class="inline-flex items-center gap-1.5">
              <CalendarIcon class="size-3.5" /> {{ date(view.post.submitted) }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <ClockIcon class="size-3.5" /> {{ getReadingTime(view.post.content) }}분
            </span>
            <span class="inline-flex items-center gap-1.5">
              <MessageCircleIcon class="size-3.5" /> {{ num(view.post.comment) }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3 text-white/85">
          <Avatar class="size-10 border border-white/25">
            <AvatarImage :src="view.post.writer.profile" :alt="recoverChars(view.post.writer.name)" />
            <AvatarFallback>{{ view.post.writer.name.slice(0, 2) }}</AvatarFallback>
          </Avatar>
          <div class="text-sm font-semibold">{{ recoverChars(view.post.writer.name) }}</div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { CalendarIcon, ClockIcon, MessageCircleIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

// view.post와 writer는 제목·작성 정보를, config는 목록 링크와 분류 설정을 제공합니다.
const { view, config } = useNuboViewContext()
const coverImage = computed(() =>
  getPreviewImage(view.value.images[0]?.thumbnail.large || view.value.post.cover),
)
</script>
