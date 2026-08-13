<template>
  <TableRow v-for="notice in notices" :key="notice.uid" class="bg-accent/25 hover:bg-accent/40">
    <TableCell class="hidden text-center text-primary md:table-cell">
      <PinIcon class="mx-auto size-4" />
    </TableCell>

    <TableCell class="min-w-0 whitespace-normal py-3.5">
      <div class="flex min-w-0 flex-col gap-1.5">
        <div class="flex min-w-0 items-center gap-2">
          <span class="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
            <PinIcon class="size-3.5 md:hidden" /> 공지
          </span>
          <NuxtLink
            :to="`/board/${config.id}/${notice.uid}`"
            class="flex min-w-0 items-center hover:text-primary"
          >
            <span class="truncate text-[0.95rem] font-semibold leading-snug">
              {{ recoverChars(notice.title) }}
            </span>
            <span
              v-if="notice.comment > 0"
              class="ml-2 shrink-0 text-xs font-semibold text-primary"
            >
              {{ notice.comment }}
            </span>
          </NuxtLink>
        </div>

        <div class="flex items-center gap-2 text-xs text-muted-foreground md:hidden">
          <span>{{ recoverChars(notice.writer.name) }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ date(notice.submitted) }}</span>
          <span aria-hidden="true">·</span>
          <span class="inline-flex items-center gap-1">
            <HeartIcon
              class="size-3"
              :class="notice.liked ? 'fill-current text-primary' : ''"
            />
            {{ num(notice.like) }}
          </span>
        </div>
      </div>
    </TableCell>

    <TableCell class="hidden md:table-cell">
      <div class="flex items-center gap-2">
        <Avatar class="size-7 border border-border/70">
          <AvatarImage :src="notice.writer.profile" />
          <AvatarFallback>{{ notice.writer.name[0] }}</AvatarFallback>
        </Avatar>
        <span class="truncate text-sm">{{ recoverChars(notice.writer.name) }}</span>
      </div>
    </TableCell>

    <TableCell class="hidden md:table-cell text-center text-sm text-muted-foreground">
      {{ date(notice.submitted) }}
    </TableCell>

    <TableCell class="hidden md:table-cell text-center text-sm text-muted-foreground">
      {{ num(notice.hit) }}
    </TableCell>
  </TableRow>
</template>

<script setup lang="ts">
import { HeartIcon, PinIcon } from "lucide-vue-next"
import { TableCell, TableRow } from "~/components/ui/table"
import { useNuboListContext } from "~/providers/contexts/list"

const { config, notices } = useNuboListContext()
</script>
