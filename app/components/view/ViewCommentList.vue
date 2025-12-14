<template>
  <section class="space-y-6 mt-8">
    <div v-if="pending && comments.length === 0">Loading ...</div>
    <div v-else v-for="(co, index) in comments" :key="index" class="group">
      <div
        class="flex gap-4"
        :class="co.uid !== co.replyUid ? 'mt-4 ml-5 space-y-6 border-l pl-5 border-muted/30' : ''"
      >
        <Avatar class="w-10 h-10 cursor-pointer">
          <AvatarImage :src="co.writer.profile" :alt="co.writer.name" />
          <AvatarFallback>{{ co.writer.name.at(0) || "U" }}</AvatarFallback>
        </Avatar>

        <div class="flex-1 space-y-1.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-foreground">{{ co.writer.name }}</span>
              <span class="text-xs text-muted-foreground">{{ dateFull(co.submitted) }}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="w-6 h-6 md:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <EllipsisVerticalIcon class="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  @click="setModify(co.uid, co.content)"
                  class="cursor-pointer"
                  :disabled="!hasPerm(co.writer.uid)"
                  >수정</DropdownMenuItem
                >
                <DropdownMenuItem
                  class="text-destructive focus:text-destructive cursor-pointer"
                  @click="confirmRemove(co.uid)"
                  :disabled="co.content === '(deleted)' || !hasPerm(co.writer.uid)"
                  >삭제</DropdownMenuItem
                >
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div
            class="text-sm text-foreground leading-relaxed whitespace-pre-wrap nubo"
            v-html="co.content"
          ></div>

          <div class="flex items-center gap-2 pt-4">
            <CommonVTooltip content="이 댓글에 나의 답글을 달아봅니다">
              <Button
                variant="outline"
                size="sm"
                class="text-muted-foreground hover:text-foreground cursor-pointer"
                v-if="co.uid === co.replyUid"
                @click="setReply(co.uid, co.content)"
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
                @click="like(co.uid, !co.liked)"
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

      <Separator class="my-6" v-if="co !== comments[comments.length - 1]" />
    </div>

    <CommonVConfirmDialog
      v-model="comment.isConfirmDialog"
      title="댓글 삭제"
      desc="정말로 선택하신 댓글을 삭제하시겠습니까?"
      cancel-text="그대로 두기"
      confirm-text="삭제하기"
      variant="destructive"
      @confirm="remove"
    />
  </section>
</template>

<script setup lang="ts">
import { MessageSquareIcon, EllipsisVerticalIcon, HeartIcon } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { BoardViewResult } from "~/types/board"

const auth = useAuthStore()
const editor = useEditorStore()
const comment = useCommentStore()
const props = defineProps<{ view: BoardViewResult }>()
const { comments, pending } = storeToRefs(comment)
await comment.getInitComments(props.view)

// 댓글 삭제하기 시 확인창 띄우기
const confirmRemove = (commentUid: number) => {
  comment.target.remove = commentUid
  comment.isConfirmDialog = true
}

// 수정 혹은 삭제 권한이 있는지 확인
const hasPerm = (writerUid: number) => {
  if (auth.user.uid === 1) {
    return true
  }
  if (writerUid === auth.user.uid) {
    return true
  }
  return false
}

// 댓글에 좋아요 남기기
const like = async (commentUid: number, liked: boolean) => {
  await comment.likeComment({
    boardUid: props.view.config.uid,
    commentUid,
    liked,
    userUid: auth.user.uid,
  })
}

// 댓글 삭제하기
const remove = async () => {
  await comment.removeComment({
    boardUid: props.view.config.uid,
    userUid: auth.user.uid,
    removeTargetUid: comment.target.remove,
  })
}

// 댓글 수정하기 준비
const setModify = (commentUid: number, content: string) => {
  comment.target.modify = commentUid
  editor.content = content
  toast(`👉 기존 댓글을 작성란으로 가져왔습니다`)
}

// 답글 남기기 준비
const setReply = (commentUid: number, content: string) => {
  comment.target.reply = commentUid
  editor.content = `<blockquote>${content}</blockquote><p>&nbsp;</p>`
  toast(`👉 답글을 남길 댓글을 작성란으로 가져왔습니다`)
}

watch(
  () => props.view.post.uid,
  () => {
    comment.page = 1
  },
)
</script>
