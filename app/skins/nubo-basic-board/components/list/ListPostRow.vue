<template>
  <TableRow
    v-for="post in posts"
    :key="post.uid"
    class="group transition-colors hover:bg-accent/35"
  >
    <TableCell class="hidden text-center md:table-cell">
      <div
        v-if="post.like === 0"
        class="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/55"
      >
        <HeartIcon class="size-3.5" />
        {{ post.like }}
      </div>

      <div v-else class="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <HeartIcon class="size-3.5" :class="post.liked ? 'fill-current text-primary' : ''" />
        {{ post.like }}
      </div>
    </TableCell>

    <TableCell class="min-w-0 whitespace-normal py-3.5">
      <div class="flex min-w-0 flex-col gap-1.5">
        <div class="flex min-w-0 items-center gap-2">
          <span
            v-if="config.useCategory && post.category.name"
            class="hidden shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground sm:inline-flex"
          >
            {{ recoverChars(post.category.name) }}
          </span>
          <LockIcon
            v-if="post.status === STATUS.SECRET"
            class="size-3.5 shrink-0 text-muted-foreground"
          />
          <NuxtLink
            :to="`/board/${config.id}/${post.uid}`"
            class="flex min-w-0 items-center hover:text-primary"
          >
            <span class="truncate text-[0.95rem] font-medium leading-snug">
              {{ recoverChars(post.title) }}
            </span>
            <span v-if="post.comment > 0" class="ml-2 shrink-0 text-xs font-semibold text-primary">
              {{ post.comment }}
            </span>
          </NuxtLink>
        </div>

        <div class="flex items-center gap-2 text-xs text-muted-foreground md:hidden">
          <span v-if="config.useCategory && post.category.name" class="sm:hidden">
            {{ recoverChars(post.category.name) }} ·
          </span>
          <span>{{ recoverChars(post.writer.name) }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ date(post.submitted) }}</span>
          <span aria-hidden="true">·</span>
          <span class="inline-flex items-center gap-1">
            <HeartIcon class="size-3" :class="post.liked ? 'fill-current text-primary' : ''" />
            {{ num(post.like) }}
          </span>
        </div>
      </div>
    </TableCell>

    <TableCell class="hidden md:table-cell">
      <div class="flex items-center gap-2">
        <Avatar class="size-7 border border-border/70">
          <AvatarImage :src="post.writer.profile" />
          <AvatarFallback>{{ post.writer.name[0] }}</AvatarFallback>
        </Avatar>
        <span class="truncate text-sm">{{ recoverChars(post.writer.name) }}</span>
      </div>
    </TableCell>

    <TableCell class="hidden md:table-cell text-center text-sm text-muted-foreground">
      {{ date(post.submitted) }}
    </TableCell>

    <TableCell class="hidden md:table-cell text-center text-sm text-muted-foreground">
      {{ num(post.hit) }}
    </TableCell>
  </TableRow>
</template>

<script setup lang="ts">
import { HeartIcon, LockIcon } from "lucide-vue-next"
import { TableCell, TableRow } from "~/components/ui/table"
import { useNuboListContext } from "~/providers/contexts/list"
import { STATUS } from "~/types/board"

// posts는 필터링된 현재 페이지 글, config는 분류 사용 여부 같은 표시 설정입니다.
const { posts, config } = useNuboListContext()
</script>
