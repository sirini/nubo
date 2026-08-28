<template>
  <ScrollArea class="h-full">
    <div class="space-y-7 p-5 sm:p-7">
      <header>
        <p
          v-if="config.useCategory && view.post.category.name"
          class="mb-2 text-xs font-semibold text-primary"
        >
          {{ recoverChars(view.post.category.name) }}
        </p>
        <h1 class="text-2xl font-semibold leading-tight tracking-[-0.035em]">
          {{ recoverChars(view.post.title) }}
        </h1>
        <p class="mt-3 text-xs text-muted-foreground">
          {{ dateFull(view.post.submitted) }} · 조회 {{ num(view.post.hit) }}
        </p>
      </header>

      <div class="flex items-center gap-3">
        <Avatar class="size-11 border border-border/70">
          <AvatarImage
            :src="view.post.writer.profile"
            :alt="recoverChars(view.post.writer.name)"
          />
          <AvatarFallback>{{ recoverChars(view.post.writer.name).charAt(0) }}</AvatarFallback>
        </Avatar>
        <div class="min-w-0">
          <NuxtLink :to="`/user/${view.post.writer.uid}`" class="font-semibold hover:text-primary">
            {{ recoverChars(view.post.writer.name) }}
          </NuxtLink>
          <p class="mt-1 truncate text-xs text-muted-foreground">
            {{ recoverChars(view.post.writer.signature) }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button
          variant="outline"
          class="gap-2"
          :disabled="!isLoggedIn"
          @click="likePost(!view.post.liked)"
        >
          <HeartIcon
            class="size-4"
            :class="view.post.liked ? 'fill-current text-primary' : ''"
          />
          {{ num(view.post.like) }}
        </Button>
        <Button variant="outline" class="gap-2" :disabled="!currentImage" @click="emit('openOriginal')">
          <Maximize2Icon class="size-4" /> 원본 보기
        </Button>
      </div>

      <div
        v-if="currentImage?.exif.make"
        class="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border/60 py-5 font-mono text-xs text-muted-foreground"
      >
        <span>{{ currentImage.exif.make }} {{ currentImage.exif.model }}</span>
        <span>{{ currentImage.exif.focalLength || "?" }}mm</span>
        <span>f/{{ (currentImage.exif.aperture || 0) / 100 }}</span>
        <span>ISO {{ currentImage.exif.iso || 0 }}</span>
      </div>

      <BoardImageDescription :description="currentImage?.description ?? ''" />

      <div class="nubo text-sm leading-7 text-foreground/90">
        <!-- eslint-disable-next-line vue/no-v-html -- 게시글 HTML은 provider에서 정제된 값을 사용합니다. -->
        <div v-html="sanitize(view.post.content)"></div>
      </div>

      <section v-if="view.tags.length" aria-labelledby="advance-gallery-tags-title">
        <h2
          id="advance-gallery-tags-title"
          class="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"
        >
          <HashIcon class="size-3.5" /> 해시태그
        </h2>
        <div class="flex flex-wrap gap-2">
          <Badge v-for="tag in view.tags" :key="tag.uid" variant="outline" as-child>
            <NuxtLink
              :to="`/board/${config.id}/search/tag/${encodeURIComponent(tag.name)}/1`"
              class="bg-background hover:border-primary/50 hover:text-primary"
            >
              #{{ recoverChars(tag.name) }}
            </NuxtLink>
          </Badge>
        </div>
      </section>

      <AdvanceGalleryComments />

      <footer class="flex flex-wrap justify-between gap-2 border-t border-border/60 pt-5">
        <Button variant="outline" class="gap-2" as-child>
          <NuxtLink :to="`/board/${config.id}/page/1`">
            <ListIcon class="size-4" /> 목록 보기
          </NuxtLink>
        </Button>
        <div class="flex gap-2">
          <Button v-if="isWriter || isAdmin" variant="outline" as-child>
            <NuxtLink :to="`/board/${config.id}/${view.post.uid}/edit`">수정</NuxtLink>
          </Button>
          <Button v-if="isLoggedIn" as-child>
            <NuxtLink :to="`/board/${config.id}/write`">사진 올리기</NuxtLink>
          </Button>
        </div>
      </footer>
    </div>
  </ScrollArea>
</template>

<script setup lang="ts">
import { HashIcon, HeartIcon, ListIcon, Maximize2Icon } from "lucide-vue-next"
import BoardImageDescription from "~/components/board/view/BoardImageDescription.vue"
import { useNuboViewContext } from "~/providers/contexts/view"
import AdvanceGalleryComments from "./AdvanceGalleryComments.vue"

const emit = defineEmits<{ openOriginal: [] }>()
const { config, imgIdx, isAdmin, isLoggedIn, isWriter, likePost, view } = useNuboViewContext()
const { sanitize } = useSanitize()
const currentImage = computed(() => view.value.images[imgIdx.value])
</script>
