<template>
  <section
    id="comments"
    class="scroll-mt-24 border-t border-border/60 pt-7"
    aria-labelledby="advance-comments-title"
  >
    <h2 id="advance-comments-title" class="mb-6 text-xl font-semibold tracking-tight">
      댓글 {{ num(view.post.comment) }}
    </h2>

    <div v-if="comments.length" class="divide-y divide-border/60">
      <article
        v-for="comment in comments"
        :key="comment.uid"
        class="group flex gap-3 py-5"
        :class="comment.uid !== comment.replyUid ? 'pl-5 sm:pl-8' : ''"
      >
        <CornerDownRightIcon
          v-if="comment.uid !== comment.replyUid"
          class="mt-3 size-4 shrink-0 text-muted-foreground"
        />
        <Avatar class="size-9 shrink-0"
          ><AvatarImage
            :src="comment.writer.profile"
            :alt="comment.writer.name"
          /><AvatarFallback>{{ comment.writer.name.charAt(0) || "U" }}</AvatarFallback></Avatar
        >
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-1.5">
              <strong class="truncate text-sm">{{ comment.writer.name }}</strong>
              <UserInlineBadges :badges="comment.writer.badges" />
            </div>
            <span class="text-xs text-muted-foreground">{{ dateFull(comment.submitted) }}</span>
          </div>
          <!-- eslint-disable vue/no-v-html -- 댓글 HTML은 화면 출력 전에 정제합니다. -->
          <div
            class="nubo nubo-comment mt-2 text-sm leading-7"
            v-html="sanitize(comment.content)"
          ></div>
          <!-- eslint-enable vue/no-v-html -->
          <div class="mt-3 flex flex-wrap items-center gap-1">
            <Button
              v-if="comment.uid === comment.replyUid"
              variant="ghost"
              size="sm"
              class="gap-1"
              :disabled="!isLoggedIn || comment.content === '(deleted)'"
              @click="beginReply(comment.uid, comment.content)"
              ><MessageSquareReplyIcon class="size-3.5" />답글</Button
            >
            <ReactionPicker
              :state="{ reactions: comment.reactions, myReaction: comment.myReaction }"
              :disabled="!isLoggedIn"
              @select="setCommentReaction(comment.uid, $event)"
            />
            <template
              v-if="checkPermissionComment(comment.writer.uid) && comment.content !== '(deleted)'"
            >
              <Button variant="ghost" size="sm" @click="beginModify(comment.uid, comment.content)"
                >수정</Button
              >
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
                @click="confirmRemoveComment(comment.uid)"
                >삭제</Button
              >
            </template>
          </div>
        </div>
      </article>
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
import {
  CornerDownRightIcon,
  LoaderCircleIcon,
  MessageSquareReplyIcon,
} from "lucide-vue-next"
import { useNuboEditorContext } from "~/providers/contexts/editor"
import { useNuboViewContext } from "~/providers/contexts/view"
import NuboTiptapEditor from "~/components/editor/NuboTiptapEditor.vue"

const { content } = useNuboEditorContext()
const {
  cancelCommentTarget,
  comments,
  commentTarget,
  checkPermissionComment,
  confirmRemoveComment,
  isConfirmRemoveCommentDialog,
  isLoggedIn,
  modifyExistComment,
  removeComment,
  setCommentReaction,
  setModifyComment,
  setReplyComment,
  view,
  writeNewComment,
  writeReplyComment,
} = useNuboViewContext()
const { sanitize } = useSanitize()
const submitting = ref(false)
const replyQuote = ref("")
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

const beginReply = (uid: number, existingContent: string) => {
  setReplyComment(uid, existingContent)
  replyQuote.value = content.value
  content.value = ""
}
const beginModify = (uid: number, existingContent: string) => {
  setModifyComment(uid, existingContent)
  replyQuote.value = ""
}
const cancelTarget = () => {
  cancelCommentTarget()
  replyQuote.value = ""
}
const submitComment = async () => {
  if (!isLoggedIn.value || submitting.value || !hasEnoughContent.value) return
  submitting.value = true
  const draft = content.value
  try {
    if (commentTarget.value.reply) content.value = `${replyQuote.value}${draft}`
    let succeeded = false
    if (commentTarget.value.reply) succeeded = await writeReplyComment()
    else if (commentTarget.value.modify) succeeded = await modifyExistComment()
    else succeeded = await writeNewComment()
    if (succeeded) {
      replyQuote.value = ""
    } else {
      content.value = draft
    }
  } finally {
    submitting.value = false
  }
}
</script>
