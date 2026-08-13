<template>
  <section>
    <div class="mb-4 flex items-end justify-between gap-4">
      <div class="min-w-0">
        <h2 class="truncate text-xl font-semibold tracking-[-0.02em]">
          {{ recoverChars(latest.config.name) }}
        </h2>
        <p class="mt-1 truncate text-sm text-muted-foreground">
          {{ recoverChars(latest.config.info) }}
        </p>
      </div>
      <NuxtLink
        :to="`/board/${latest.config.id}/page/1`"
        class="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        전체 보기 <ArrowRightIcon class="size-4" />
      </NuxtLink>
    </div>

    <div class="overflow-hidden rounded-2xl border border-border/70 bg-card/75">
      <NuxtLink
        v-for="post in latest.items"
        :key="post.uid"
        :to="`/board/${post.id}/${post.uid}`"
        class="group grid min-h-13 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/55 px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/45 md:grid-cols-[minmax(0,1fr)_9rem_6rem_4.5rem]"
      >
        <div class="min-w-0">
          <div class="flex min-w-0 items-center gap-2">
            <span class="truncate text-[0.95rem] font-medium group-hover:text-primary">
              {{ recoverChars(post.title) }}
            </span>
            <span v-if="post.comment > 0" class="shrink-0 text-xs font-semibold text-primary">
              {{ post.comment }}
            </span>
          </div>
          <div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground md:hidden">
            <span>{{ recoverChars(post.writer.name) }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ date(post.submitted) }}</span>
          </div>
        </div>

        <div class="hidden truncate text-sm text-muted-foreground md:block">
          {{ recoverChars(post.writer.name) }}
        </div>
        <time class="hidden text-xs text-muted-foreground md:block">
          {{ date(post.submitted) }}
        </time>
        <div class="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
          <EyeIcon class="size-3.5" /> {{ num(post.hit) }}
        </div>
      </NuxtLink>

      <div v-if="latest.items.length === 0" class="px-4 py-10 text-center text-sm text-muted-foreground">
        아직 등록된 글이 없습니다.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRightIcon, EyeIcon } from "lucide-vue-next"
import type { HomePostResult } from "~/types/home"

defineProps<{ latest: HomePostResult }>()
</script>
