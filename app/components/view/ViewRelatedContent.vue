<template>
  <section class="my-6">
    <div class="flex items-center justify-between mb-4">
      <div class="inline-flex gap-3 items-center pl-2">
        <Avatar>
          <AvatarImage :src="view.post.writer.profile" alt="Profile image" />
          <AvatarFallback>{{ view.post.writer.name.charAt(0) }}</AvatarFallback>
        </Avatar>
        <h3 class="text-xl font-semibold tracking-tight">{{ view.post.writer.name }}님의 활동</h3>
      </div>

      <Button variant="link" class="text-muted-foreground p-0 h-auto cursor-pointer" as-child>
        <NuxtLink :to="`/user/${view.post.writer.uid}`">
          프로필 보기 <ArrowRightIcon class="ml-1 h-4 w-4" />
        </NuxtLink>
      </Button>
    </div>

    <Card class="border-none p-0 shadow-none">
      <CardContent class="grid gap-4 md:grid-cols-4 p-0">
        <ProfileLatestPosts :posts="view.writerPosts" />
        <ProfileLatestComments :comments="view.writerComments" />
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { ArrowRightIcon } from "lucide-vue-next"
import type { BoardViewResult } from "~/types/board"

const auth = useAuthStore()
const props = defineProps<{ view: BoardViewResult }>()
</script>
