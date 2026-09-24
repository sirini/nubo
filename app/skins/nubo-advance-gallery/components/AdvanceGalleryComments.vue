<template>
  <section
    id="comments"
    class="scroll-mt-24 border-t border-border/60 pt-7"
    aria-labelledby="advance-comments-title"
  >
    <h2 id="advance-comments-title" class="mb-6 text-xl font-semibold tracking-tight">
      댓글 {{ num(view.post.comment) }}
    </h2>

<div v-if="comments.length">
      <CommentNode
        v-for="(node, index) in tree"
        :key="node.comment.uid"
        :node="node"
        :depth="0"
        :is-first="index === 0"
      />
    </div>
    <p
      v-else
      class="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground"
    >
      아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
    </p>

    <div
      class="mt-8 rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold">{{ formTitle }}</h3>
          <p
            v-if="commentTarget.reply || commentTarget.modify"
            class="mt-1 text-xs text-muted-foreground"
          >
            선택한 작업을 취소하면 작성 중인 내용이 지워집니다.
          </p>
        </div>
        <Button
          v-if="commentTarget.reply || commentTarget.modify"
          type="button"
          variant="ghost"
          size="sm"
          @click="cancelTarget"
          >취소</Button
        >
      </div>
      <NuboTiptapEditor v-if="isLoggedIn" v-model="content" :config="view.config" profile="comment" />
      <p v-else class="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
        로그인 후 댓글을 작성할 수 있습니다.
      </p>
      <div class="mt-3 flex justify-end">
        <Button type="button" :disabled="!isLoggedIn || submitting || !hasEnoughContent" @click="submitComment"
          ><LoaderCircleIcon v-if="submitting" class="size-4 animate-spin" />{{
            submitLabel
          }}</Button
        >
      </div>
    </div>

    <CommonVConfirmDialog
      v-model="isConfirmRemoveCommentDialog"
      title="댓글 삭제"
      desc="선택한 댓글을 삭제하시겠습니까?"
      cancel-text="그대로 두기"
      confirm-text="삭제하기"
      variant="destructive"
      @confirm="removeComment()"
    />
  </section>
</template>

<script setup lang="ts">
import { LoaderCircleIcon } from "lucide-vue-next"
import { useNuboEditorContext } from "~/providers/contexts/editor"
import { useNuboViewContext } from "~/providers/contexts/view"
import NuboTiptapEditor from "~/components/editor/NuboTiptapEditor.vue"
import CommentNode from "~/components/comment/CommentNode.vue"
import { buildCommentTree } from "~/types/comment"

const { content } = useNuboEditorContext()
const {
  cancelCommentTarget,
  comments,
  commentTarget,
  isConfirmRemoveCommentDialog,
  isLoggedIn,
  modifyExistComment,
  removeComment,
  view,
  writeNewComment,
  writeReplyComment,
} = useNuboViewContext()
const submitting = ref(false)
const tree = computed(() => buildCommentTree(comments.value))
const hasEnoughContent = computed(() => {
  if (!import.meta.client) return false
  const text = new DOMParser().parseFromString(content.value, "text/html").body.textContent || ""
  return text.trim().length >= 10
})
const formTitle = computed(() =>
  commentTarget.value.reply ? "답글 작성" : commentTarget.value.modify ? "댓글 수정" : "댓글 작성",
)
const submitLabel = computed(() =>
  commentTarget.value.reply
    ? "답글 남기기"
    : commentTarget.value.modify
      ? "수정 완료"
      : "댓글 남기기",
)

const cancelTarget = () => {
  cancelCommentTarget()
}
const submitComment = async () => {
  if (!isLoggedIn.value || submitting.value || !hasEnoughContent.value) return
  submitting.value = true
  try {
    if (commentTarget.value.reply) await writeReplyComment()
    else if (commentTarget.value.modify) await modifyExistComment()
    else await writeNewComment()
  } finally {
    submitting.value = false
  }
}
</script>
