<template>
  <div class="comment-node relative">
    <!-- 다음 형제가 있으면 자손 전체 높이만큼 부모 쪽 레일을 잇는다. -->
    <span v-if="showConnector && !isLast" aria-hidden="true" class="connector-line"></span>
    <div class="relative">
      <!-- 부모 레일에서 이 댓글 아바타까지 연결한다. -->
      <span v-if="showConnector" aria-hidden="true" class="connector-elbow"></span>
      <!-- 들여쓴 자식이 있을 때만 내 아바타 아래에 새 레일을 연다. -->
      <span v-if="showChildSpine" aria-hidden="true" class="avatar-spine"></span>

      <div
        class="group"
        :class="depth === 0 ? (isFirst ? '' : 'border-t border-border/60') : ''"
      >
        <div class="flex gap-3 py-5 sm:gap-4">
          <Avatar class="size-9 shrink-0 cursor-pointer border border-border/70">
            <AvatarImage :src="comment.writer.profile" :alt="comment.writer.name" />
            <AvatarFallback>{{ comment.writer.name.at(0) || "U" }}</AvatarFallback>
          </Avatar>

          <div class="min-w-0 flex-1 space-y-1.5">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span>{{ comment.writer.name }}</span>
                <UserInlineBadges v-if="comment.writer.badges?.length" :badges="comment.writer.badges" />
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
    </div>

    <!-- 깊이 제한을 넘으면 들여쓰지 않고 이어 붙인다(모바일 가독성). -->
    <div v-if="childrenExpanded" :class="depth < COMMENT_MAX_DEPTH ? 'comment-children' : ''">
      <CommentNode
        v-for="(child, index) in node.children"
        :key="child.comment.uid"
        :node="child"
        :depth="depth + 1"
        :is-last="index === node.children.length - 1"
        :is-first="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronRightIcon,
  EllipsisVerticalIcon,
  EraserIcon,
  MessageSquareIcon,
  ShredderIcon,
} from "lucide-vue-next"
import type { CommentNode as CommentNodeType } from "~/types/comment"
import { useNuboViewContext } from "~/providers/contexts/view"

// 화면 들여쓰기 상한. 저장 깊이는 제한하지 않는다.
const COMMENT_MAX_DEPTH = 6

const props = withDefaults(
  defineProps<{ node: CommentNodeType; depth: number; isLast?: boolean; isFirst?: boolean }>(),
  { isLast: true, isFirst: true },
)
const collapsed = ref(false)

const comment = computed(() => props.node.comment)
const replyTo = computed(() => props.node.replyTo)
const childrenExpanded = computed(() => props.node.children.length > 0 && !collapsed.value)
// 부모가 나를 들여쓰기한 경우(깊이 상한 안)에만 부모와의 연결선을 그린다.
const showConnector = computed(() => props.depth >= 1 && props.depth <= COMMENT_MAX_DEPTH)
const showChildSpine = computed(() => childrenExpanded.value && props.depth < COMMENT_MAX_DEPTH)

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

<style scoped>
/* 아바타 36px, 행 안여백 20px. 각 레일은 인접 구간 하나만 그린다. */
.comment-node {
  --comment-indent: 24px;
  --comment-avatar-center: 18px;
  --comment-row-center: 38px;
  --comment-avatar-bottom: 56px;
}
@media (min-width: 640px) {
  .comment-node {
    --comment-indent: 28px;
  }
}
.comment-children {
  margin-left: var(--comment-indent);
}
.connector-elbow,
.connector-line,
.avatar-spine {
  pointer-events: none;
  border-color: var(--border);
}
.connector-elbow {
  position: absolute;
  left: calc(var(--comment-avatar-center) - var(--comment-indent));
  top: 0;
  width: var(--comment-indent);
  height: var(--comment-row-center);
  border-left-style: solid;
  border-left-width: 1px;
  border-bottom-style: solid;
  border-bottom-width: 1px;
  border-bottom-left-radius: 12px;
}
.connector-line {
  position: absolute;
  left: calc(var(--comment-avatar-center) - var(--comment-indent));
  top: var(--comment-row-center);
  bottom: 0;
  border-left-style: solid;
  border-left-width: 1px;
}
.avatar-spine {
  position: absolute;
  left: var(--comment-avatar-center);
  top: var(--comment-avatar-bottom);
  bottom: 0;
  border-left-style: solid;
  border-left-width: 1px;
}
</style>
