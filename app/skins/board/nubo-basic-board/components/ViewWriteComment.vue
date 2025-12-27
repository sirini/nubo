<template>
  <EditorTiptapEditor v-model="content" :config="view.config" />
  <Button
    variant="outline"
    class="w-full mt-3 cursor-pointer"
    size="lg"
    @click="writeReplyComment"
    v-if="commentTarget.reply"
    >기존 댓글에 답글을 남깁니다</Button
  >

  <Button
    variant="outline"
    class="w-full mt-3 cursor-pointer"
    size="lg"
    @click="modifyExistComment"
    v-else-if="commentTarget.modify"
    >기존 댓글을 수정합니다</Button
  >

  <Button
    variant="outline"
    class="w-full mt-3 cursor-pointer"
    size="lg"
    :disabled="!isLoggedIn"
    @click="writeNewComment"
    v-else
    >{{ isLoggedIn ? "새로운 댓글을 남깁니다" : "로그인이 필요합니다" }}</Button
  >
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const {
  content,
  isLoggedIn,
  view,
  commentTarget,
  writeNewComment,
  writeReplyComment,
  modifyExistComment,
} = useNuboViewContext()
</script>
