<template>
  <section class="space-y-6 mt-8">
    <div v-if="comments.length > 0" v-for="(co, index) in comments" :key="index" class="group">
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
                  @click="setModifyComment(co.uid, co.content)"
                  class="cursor-pointer"
                  :disabled="!checkPermissionComment(co.writer.uid)"
                  >수정</DropdownMenuItem
                >
                <DropdownMenuItem
                  class="text-destructive focus:text-destructive cursor-pointer"
                  @click="confirmRemoveComment(co.uid)"
                  :disabled="co.content === '(deleted)' || !checkPermissionComment(co.writer.uid)"
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
                @click="setReplyComment(co.uid, co.content)"
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
                @click="likeComment(co.uid, !co.liked)"
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
      v-model="isConfirmDialog"
      title="댓글 삭제"
      desc="정말로 선택하신 댓글을 삭제하시겠습니까?"
      cancel-text="그대로 두기"
      confirm-text="삭제하기"
      variant="destructive"
      @confirm="removeComment()"
    />
  </section>
</template>

<script setup lang="ts">
import { EllipsisVerticalIcon, HeartIcon, MessageSquareIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const {
  comments,
  checkPermissionComment,
  likeComment,
  confirmRemoveComment,
  removeComment,
  setModifyComment,
  setReplyComment,
} = useNuboViewContext()

const isConfirmDialog = ref<boolean>(false)
</script>
