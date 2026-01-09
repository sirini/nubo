<template>
  <TableRow v-for="notice in notices" :key="notice.uid">
    <TableCell class="hidden md:table-cell text-center text-muted-foreground">
      <PinIcon class="w-4 h-4 mx-auto" />
    </TableCell>

    <TableCell>
      <div class="flex flex-col gap-2">
        <div class="flex items-center">
          <NuxtLink :to="`/board/${config.id}/${notice.uid}`">
            <span class="font-medium text-base leading-snug">{{ recoverChars(notice.title) }}</span>
            <span v-if="notice.comment > 0" class="text-primary text-xs font-bold ml-2"
              >[{{ notice.comment }}]
            </span>
          </NuxtLink>
        </div>

        <div class="md:hidden flex items-center gap-2 text-xs text-muted-foreground">
          <span class="flex items-center gap-2"
            ><HeartIcon class="w-3 h-3" :class="notice.liked ? 'text-red-200 fill-current' : ''" />
            {{ num(notice.like) }}</span
          >
          <span>·</span>
          <span>{{ recoverChars(notice.writer.name) }}</span>
          <span>·</span>
          <span>{{ date(notice.submitted) }}</span>
        </div>
      </div>
    </TableCell>

    <TableCell class="hidden md:table-cell">
      <div class="flex items-center gap-2">
        <Avatar class="w-6 h-6">
          <AvatarImage :src="notice.writer.profile" />
          <AvatarFallback>{{ notice.writer.name[0] }}</AvatarFallback>
        </Avatar>
        <span class="text-sm">{{ notice.writer.name }}</span>
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
import { useNuboListContext } from "~/types/nubo-skin-keys"

const { config, notices } = useNuboListContext()
</script>
