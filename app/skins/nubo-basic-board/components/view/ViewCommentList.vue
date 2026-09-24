<template>
  <section>
    <CommentNode
      v-for="(node, index) in tree"
      :key="node.comment.uid"
      :node="node"
      :depth="0"
      :is-first="index === 0"
    />

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
import { buildCommentTree } from "~/types/comment"
import { useNuboViewContext } from "~/providers/contexts/view"

const { comments, isConfirmRemoveCommentDialog, removeComment } = useNuboViewContext()
const tree = computed(() => buildCommentTree(comments.value))
</script>
