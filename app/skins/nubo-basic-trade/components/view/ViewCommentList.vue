<template>
  <section>
    <div v-for="co in comments" :key="co.uid" class="group border-t border-border/60 first:border-t-0">
      <div class="flex gap-3 py-5 sm:gap-4" :class="co.uid !== co.replyUid ? 'pl-4 sm:pl-8' : ''">
        <CornerDownRightIcon
          v-if="co.uid !== co.replyUid"
          class="mt-3 size-4 shrink-0 text-muted-foreground"
        />

        <Avatar class="size-9 shrink-0 cursor-pointer border border-border/70">
          <AvatarImage :src="co.writer.profile" :alt="co.writer.name" />
          <AvatarFallback>{{ co.writer.name.at(0) || "U" }}</AvatarFallback>
        </Avatar>

        <div class="min-w-0 flex-1 space-y-1.5">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold text-foreground">
                <span>{{ co.writer.name }}</span>
              </div>
              <div class="mt-1 text-xs text-muted-foreground">{{ dateFull(co.submitted) }}</div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7 cursor-pointer md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                >
                  <EllipsisVerticalIcon class="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  class="cursor-pointer flex items-center gap-3"
                  :disabled="!checkPermissionComment(co.writer.uid)"
                  @click="setModifyComment(co.uid, co.content)"
                >
                  <EraserIcon class="w-4 h-4" />
                  수정</DropdownMenuItem
                >
                <DropdownMenuItem
                  class="text-destructive focus:text-destructive cursor-pointer flex items-center gap-3"
                  :disabled="co.content === '(deleted)' || !checkPermissionComment(co.writer.uid)"
                  @click="confirmRemoveComment(co.uid)"
                >
                  <ShredderIcon class="w-4 h-4" />
                  삭제</DropdownMenuItem
                >
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <!-- eslint-disable vue/no-v-html -- 댓글 HTML은 useSanitize()로 정제합니다. -->
          <div
            class="nubo whitespace-pre-wrap pt-2 text-sm leading-7 text-foreground"
            v-html="sanitize(co.content)"
          ></div>
          <!-- eslint-enable vue/no-v-html -->

          <div class="flex items-center gap-2 pt-3">
            <CommonVTooltip content="이 댓글에 나의 답글을 달아봅니다">
              <Button
                v-if="co.uid === co.replyUid"
                variant="outline"
                size="sm"
                class="text-muted-foreground hover:text-foreground cursor-pointer"
                :disabled="!isLoggedIn"
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
                :disabled="!isLoggedIn"
                @click="likeComment(co.uid, !co.liked)"
              >
                <HeartIcon
                  class="mr-1.5 h-3 w-3"
                  :class="co.liked ? 'fill-current text-primary' : co.like ? 'text-primary' : ''"
                />
                <span class="text-xs">{{ co.like > 0 ? co.like : "좋아요" }}</span>
              </Button>
            </CommonVTooltip>
          </div>
        </div>
      </div>

    </div>

    <div v-if="comments.length === 0" class="py-8 text-center text-sm text-muted-foreground">
      아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
    </div>

    <CommonVConfirmDialog
      v-model="isConfirmRemoveCommentDialog"
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
import {
  CornerDownRightIcon,
  EllipsisVerticalIcon,
  EraserIcon,
  HeartIcon,
  MessageSquareIcon,
  ShredderIcon,
} from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const {
  comments,
  isConfirmRemoveCommentDialog,
  isLoggedIn,
  checkPermissionComment,
  likeComment,
  confirmRemoveComment,
  removeComment,
  setModifyComment,
  setReplyComment,
} = useNuboViewContext()
const { sanitize } = useSanitize()
</script>
