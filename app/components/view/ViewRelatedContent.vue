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

    <Card class="bg-card/50 backdrop-blur-sm shadow-sm">
      <CardContent class="grid gap-6 md:grid-cols-2">
        <div>
          <div class="flex items-center gap-2 text-muted-foreground mb-2">
            <FileTextIcon class="h-4 w-4" />
            <span class="text-sm font-medium">최근 작성한 글</span>
          </div>

          <div class="flex flex-col gap-3">
            <NuxtLink
              v-for="post in view.writerPosts"
              :key="post.postUid"
              :to="`/board/${post.board.id}/${post.postUid}`"
              class="block group p-3 rounded-lg border bg-background hover:bg-muted/50 hover:border-muted-foreground/30 transition-all"
            >
              <div class="flex flex-col gap-1">
                <div
                  class="text-sm text-foreground line-clamp-1 group-hover:text-primary"
                  v-html="post.title"
                ></div>

                <div class="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span class="shrink-0">{{ date(post.submitted) }}</span>
                </div>
              </div>
            </NuxtLink>

            <div
              v-if="view.writerPosts.length === 0"
              class="text-sm text-muted-foreground py-4 text-center"
            >
              작성한 글이 없습니다.
            </div>
          </div>
        </div>

        <Separator class="md:hidden my-2" />

        <div>
          <div class="flex items-center gap-2 text-muted-foreground mb-2">
            <MessageCircleIcon class="h-4 w-4" />
            <span class="text-sm font-medium">최근 남긴 댓글</span>
          </div>

          <div class="space-y-3">
            <NuxtLink
              v-for="comment in view.writerComments"
              :key="comment.postUid"
              :to="`/board/${comment.board.id}/${comment.postUid}`"
              class="block group p-3 rounded-lg border bg-background hover:bg-muted/50 hover:border-muted-foreground/30 transition-all"
            >
              <div class="flex flex-col gap-1">
                <div
                  class="text-sm text-foreground line-clamp-1 group-hover:text-primary"
                  v-html="comment.content"
                ></div>

                <div class="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span class="shrink-0">{{ date(comment.submitted) }}</span>
                </div>
              </div>
            </NuxtLink>

            <div
              v-if="view.writerComments.length === 0"
              class="text-sm text-muted-foreground py-4 text-center"
            >
              작성한 댓글이 없습니다.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { ArrowRightIcon, FileTextIcon, MessageCircleIcon } from "lucide-vue-next"
import type { BoardViewResult } from "~/types/board"

const auth = useAuthStore()
const props = defineProps<{ view: BoardViewResult }>()
</script>
