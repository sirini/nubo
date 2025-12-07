<template>
  <section class="space-y-6 mt-8">
    <div v-for="(co, index) in comment.comments" :key="index" class="group">
      <div
        class="flex gap-4"
        :class="
          co.uid !== co.replyUid ? 'mt-4 ml-14 space-y-5 border-l-4 pl-6 border-muted/30' : ''
        "
      >
        <Avatar class="w-10 h-10 cursor-pointer">
          <AvatarImage :src="co.writer.profile" :alt="co.writer.name" />
          <AvatarFallback>{{ co.writer.name.at(0) || "U" }}</AvatarFallback>
        </Avatar>

        <div class="flex-1 space-y-1.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-foreground">{{ co.writer.name }}</span>
              <span class="text-xs text-muted-foreground">{{ date(co.submitted) }}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <CommonVTooltip content="이 댓글을 수정 혹은 삭제 하실 수 있습니다">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <EllipsisVerticalIcon class="w-4 h-4" />
                  </Button>
                </CommonVTooltip>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>수정</DropdownMenuItem>
                <DropdownMenuItem class="text-destructive focus:text-destructive"
                  >삭제</DropdownMenuItem
                >
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p
            class="text-sm text-foreground leading-relaxed whitespace-pre-wrap"
            v-html="co.content"
          ></p>

          <div class="flex items-center gap-2 pt-4">
            <CommonVTooltip content="이 댓글에 나의 답글을 달아봅니다">
              <Button
                variant="outline"
                size="sm"
                class="text-muted-foreground hover:text-foreground cursor-pointer"
                v-if="co.uid === co.replyUid"
              >
                <MessageSquareIcon class="mr-1.5 h-3 w-3" />
                <span class="text-xs">답글 달기</span>
              </Button>
            </CommonVTooltip>

            <CommonVTooltip
              :content="
                co.liked ? '이 댓글에 남긴 좋아요를 취소합니다' : '이 댓글에 좋아요를 남깁니다'
              "
            >
              <Button
                variant="outline"
                size="sm"
                class="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <HeartIcon
                  class="mr-1.5 h-3 w-3"
                  :class="co.liked ? 'text-red-300 fill-current' : co.like ? 'text-red-300' : ''"
                />
                <span class="text-xs">{{ co.like > 0 ? co.like : "좋아요" }}</span>
              </Button>
            </CommonVTooltip>
          </div>
        </div>
      </div>

      <Separator class="my-6" v-if="co !== comment.comments[comment.comments.length - 1]" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { MessageSquareIcon, EllipsisVerticalIcon, HeartIcon } from "lucide-vue-next"
import type { BoardViewResult } from "~/types/board"

const props = defineProps<{
  view: BoardViewResult
}>()
const auth = useAuthStore()
const comment = useCommentStore()

await comment.getInitComments(props.view)

watch(
  () => props.view.post.uid,
  () => {
    comment.page = 1
  },
)
</script>
