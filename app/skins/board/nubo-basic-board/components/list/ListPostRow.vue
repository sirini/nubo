<template>
  <TableRow v-for="post in posts" :key="post.uid">
    <TableCell class="hidden md:table-cell text-center">
      <div class="flex items-center gap-2 justify-center text-muted" v-if="post.like === 0">
        <HeartIcon class="w-3 h-3" />
        {{ post.like }}
      </div>

      <div class="flex items-center gap-2 justify-center text-muted-foreground" v-else>
        <HeartIcon class="w-3 h-3" :class="post.liked ? 'text-red-200 fill-current' : ''" />
        {{ post.like }}
      </div>
    </TableCell>

    <TableCell>
      <div class="flex flex-col gap-2">
        <div class="flex items-center">
          <NuxtLink :to="`/board/${config.id}/${post.uid}`">
            <span class="text-base leading-snug">{{ recoverChars(post.title) }}</span>
            <span v-if="post.comment > 0" class="text-primary text-xs font-bold ml-2"
              >[{{ post.comment }}]
            </span>
          </NuxtLink>
        </div>

        <div class="md:hidden flex items-center gap-2 text-xs text-muted-foreground">
          <span class="flex items-center gap-2"
            ><HeartIcon class="w-3 h-3" :class="post.liked ? 'text-red-200 fill-current' : ''" />
            {{ num(post.like) }}</span
          >
          <span>·</span>
          <span>{{ recoverChars(post.writer.name) }}</span>
          <span>·</span>
          <span>{{ date(post.submitted) }}</span>
        </div>
      </div>
    </TableCell>

    <TableCell class="hidden md:table-cell">
      <div class="flex items-center gap-2">
        <Avatar class="w-6 h-6">
          <AvatarImage :src="post.writer.profile" />
          <AvatarFallback>{{ post.writer.name[0] }}</AvatarFallback>
        </Avatar>
        <span class="text-sm">{{ post.writer.name }}</span>
      </div>
    </TableCell>

    <TableCell class="hidden md:table-cell text-center text-sm text-muted-foreground">
      {{ date(post.submitted) }}
    </TableCell>

    <TableCell class="hidden md:table-cell text-center text-sm text-muted-foreground">
      {{ post.hit }}
    </TableCell>
  </TableRow>
</template>

<script setup lang="ts">
import { HeartIcon } from "lucide-vue-next"
import { TableCell, TableRow } from "~/components/ui/table"
import { useNuboListContext } from "~/types/nubo-skin-keys"

const { posts, config } = useNuboListContext()
</script>
