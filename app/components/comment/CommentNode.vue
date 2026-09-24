<template>
  <div class="comment-node">
    <div class="group border-t border-border/60 first:border-t-0">
      <div class="flex gap-3 py-5 sm:gap-4">
        <CornerDownRightIcon
          v-if="replyTo"
          class="mt-3 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />

        <Avatar class="size-9 shrink-0 cursor-pointer border border-border/70">
          <AvatarImage :src="comment.writer.profile" :alt="comment.writer.name" />
          <AvatarFallback>{{ comment.writer.name.at(0) || "U" }}</AvatarFallback>
        </Avatar>

        <div class="min-w-0 flex-1 space-y-1.5">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span>{{ comment.writer.name }}</span>
                <span
                  v-if="replyTo"
                  class="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground"
                >
                  {{ replyTo }}님께 답글
                </span>
              </div>
              <div class="mt-1 text-xs text-muted-foreground">{{ dateFull(comment.submitted) }}</div>
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
                  :disabled="!checkPermissionComment(comment.writer.uid)"
                  @click="setModifyComment(comment.uid, comment.content)"
                >
                  <EraserIcon class="w-4 h-4" />
                  수정</DropdownMenuItem
                >
                <DropdownMenuItem
                  class="text-destructive focus:text-destructive cursor-pointer flex items-center gap-3"
                  :disabled="comment.content === '(deleted)' || !checkPermissionComment(comment.writer.uid)"
                  @click="confirmRemoveComment(comment.uid)"
                >
                  <ShredderIcon class="w-4 h-4" />
                  삭제</DropdownMenuItem
                >
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <!-- eslint-disable vue/no-v-html -- 댓글 HTML은 useSanitize()로 정제합니다. -->
          <div
            class="nubo nubo-comment pt-2 text-sm leading-7 text-foreground"
            v-html="sanitize(comment.content)"
          ></div>
          <!-- eslint-enable vue/no-v-html -->

          <div class="flex items-center gap-2 pt-3">
            <CommonVTooltip content="이 댓글에 나의 답글을 달아봅니다">
              <Button
                variant="outline"
                size="sm"
                class="text-muted-foreground hover:text-foreground cursor-pointer"
                :disabled="!isLoggedIn"
                @click="setReplyComment(comment.uid, comment.content)"
              >
                <MessageSquareIcon class="mr-1.5 h-3 w-3" />
                <span class="text-xs">답글 달기</span>
              </Button>
            </CommonVTooltip>

            <ReactionPicker
              :state="{ reactions: comment.reactions, myReaction: comment.myReaction }"
              :disabled="!isLoggedIn"
              @select="setCommentReaction(comment.uid, $event)"
            />

            <Button
              v-if="node.children.length"
              variant="ghost"
              size="sm"
              class="text-muted-foreground hover:text-foreground cursor-pointer"
              :aria-expanded="!collapsed"
              @click="collapsed = !collapsed"
            >
              <ChevronRightIcon
                class="mr-1 h-3 w-3 transition-transform"
                :class="collapsed ? '' : 'rotate-90'"
                aria-hidden="true"
              />
              <span class="text-xs">{{ collapsed ? `답글 ${node.children.length}개 펼치기` : "답글 접기" }}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 깊이 제한을 넘으면 더 이상 들여쓰지 않고 이어 붙인다(모바일 가독성). -->
    <div
      v-if="node.children.length && !collapsed"
      :class="depth < COMMENT_MAX_DEPTH ? 'ml-4 border-l border-border/60 pl-3 sm:ml-5 sm:pl-4' : ''"
    >
      <CommentNode v-for="child in node.children" :key="child.comment.uid" :node="child" :depth="depth + 1" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronRightIcon,
  CornerDownRightIcon,
  EllipsisVerticalIcon,
  EraserIcon,
  MessageSquareIcon,
  ShredderIcon,
} from "lucide-vue-next"
import type { CommentNode as CommentNodeType } from "~/types/comment"
import { useNuboViewContext } from "~/providers/contexts/view"

// 화면 들여쓰기 상한. 저장 깊이는 제한하지 않는다.
const COMMENT_MAX_DEPTH = 6

const props = defineProps<{ node: CommentNodeType; depth: number }>()
const collapsed = ref(false)

const comment = computed(() => props.node.comment)
const replyTo = computed(() => props.node.replyTo)

const {
  isLoggedIn,
  checkPermissionComment,
  setCommentReaction,
  confirmRemoveComment,
  setModifyComment,
  setReplyComment,
} = useNuboViewContext()
const { sanitize } = useSanitize()
</script>
