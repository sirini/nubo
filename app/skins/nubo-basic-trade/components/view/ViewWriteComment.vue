<template>
  <div class="overflow-hidden rounded-xl border border-border/70 bg-background/45">
    <NuboTiptapEditor v-model="edit.content" :config="view.config" profile="comment" />
  </div>
  <Button
    v-if="commentTarget.reply"
    variant="outline"
    class="mt-3 w-full cursor-pointer"
    @click="writeReplyComment"
    >기존 댓글에 답글을 남깁니다</Button
  >

  <Button
    v-else-if="commentTarget.modify"
    variant="outline"
    class="mt-3 w-full cursor-pointer"
    @click="modifyExistComment"
    >기존 댓글을 수정합니다</Button
  >

  <Button
    v-else
    variant="outline"
    class="mt-3 w-full cursor-pointer"
    :disabled="!isLoggedIn"
    @click="writeNewComment"
    >{{ isLoggedIn ? "새로운 댓글을 남깁니다" : "로그인이 필요합니다" }}</Button
  >
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import NuboTiptapEditor from "~/components/editor/NuboTiptapEditor.vue"

const edit = useEditorStore()
const { isLoggedIn, view, commentTarget, writeNewComment, writeReplyComment, modifyExistComment } =
  useNuboViewContext()
</script>
