<template>
  <EditorTiptapEditor v-model="editor.content" :config="config" />
  <Button
    variant="outline"
    class="w-full mt-3 cursor-pointer"
    size="lg"
    @click="reply"
    v-if="comment.target.reply"
    >기존 댓글에 답글을 남깁니다</Button
  >

  <Button
    variant="outline"
    class="w-full mt-3 cursor-pointer"
    size="lg"
    @click="modify"
    v-else-if="comment.target.modify"
    >기존 댓글을 수정합니다</Button
  >

  <Button
    variant="outline"
    class="w-full mt-3 cursor-pointer"
    size="lg"
    :disabled="!auth.isLoggedIn"
    @click="write"
    v-else
    >{{ auth.isLoggedIn ? "새로운 댓글을 남깁니다" : "로그인이 필요합니다" }}</Button
  >
</template>

<script setup lang="ts">
import type { BoardConfig } from "~/types/board"

const route = useRoute()
const editor = useEditorStore()
const auth = useAuthStore()
const comment = useCommentStore()
const props = defineProps<{ config: BoardConfig }>()
const postUid = computed(() => parseInt(route.params?.postUid as string))

// 댓글 작성
const write = async () => {
  await comment.writeComment(
    {
      boardUid: props.config.uid,
      postUid: postUid.value,
      userUid: auth.user.uid,
      content: editor.content,
    },
    auth.user,
  )
  editor.content = ""
}

// 답글 작성
const reply = async () => {
  await comment.replyComment(
    {
      boardUid: props.config.uid,
      postUid: postUid.value,
      userUid: auth.user.uid,
      content: editor.content,
      replyTargetUid: comment.target.reply,
    },
    auth.user,
  )
  editor.content = ""
}

// 댓글 수정
const modify = async () => {
  await comment.modifyComment({
    boardUid: props.config.uid,
    postUid: postUid.value,
    userUid: auth.user.uid,
    content: editor.content,
    modifyTargetUid: comment.target.modify,
  })
  editor.content = ""
}
</script>
