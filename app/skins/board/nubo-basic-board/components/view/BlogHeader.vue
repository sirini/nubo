<template>
  <header class="relative w-full h-[60vh] md:h-[70vh] overflow-hidden rounded-t-lg">
    <img
      v-if="view.images.length > 0"
      :src="view.images[0]?.thumbnail.large"
      class="w-full h-full object-cover select-none"
    />
    <div
      class="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent"
    ></div>

    <div class="absolute bottom-0 left-0 w-full pb-12">
      <div class="container mx-auto px-4">
        <Badge
          variant="outline"
          class="mb-4 backdrop-blur-sm border-white/20 text-white text-sm"
          v-if="config.useCategory"
        >
          {{ view.post.category.name }}
        </Badge>

        <CardHeader
          class="px-0 text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg mb-6 break-keep"
        >
          <CardTitle> {{ recoverChars(view.post.title) }}</CardTitle>
          <CardDescription class="text-white/50 flex items-center gap-4 font-normal mt-3">
            <span class="inline-flex gap-1.5 items-center">
              <CalendarIcon class="w-3 h-3" />
              {{ date(view.post.submitted) }}
            </span>

            <span class="inline-flex gap-1.5 items-center"
              ><ClockIcon class="w-3 h-3" />{{ getReadingTime(view.post.content) }} 분 소요</span
            >

            <span class="inline-flex gap-1.5 items-center">
              <MessageCircleIcon class="w-3 h-3" />
              <span>{{ num(view.post.comment) }}</span>
            </span>
          </CardDescription>
        </CardHeader>

        <div class="flex items-center gap-4 text-white/80">
          <Avatar class="w-10 h-10 border-2 border-white/20">
            <AvatarImage :src="view.post.writer.profile" />
            <AvatarFallback>{{ view.post.writer.name.slice(0, 2) }}</AvatarFallback>
          </Avatar>

          <div class="text-sm">
            <div class="font-bold text-lg">{{ recoverChars(view.post.writer.name) }}</div>
            <div class="opacity-60 flex items-center gap-4"></div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { CalendarIcon, ClockIcon, MessageCircleIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const { view, config } = useNuboViewContext()
</script>
