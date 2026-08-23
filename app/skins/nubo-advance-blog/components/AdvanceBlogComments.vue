<template>
  <section
    class="mx-auto max-w-3xl px-4 py-12 sm:px-6"
    aria-labelledby="advance-blog-comments-title"
  >
    <h2 id="advance-blog-comments-title" class="mb-6 text-xl font-semibold tracking-tight">
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
            <strong class="text-sm">{{ comment.writer.name }}</strong
            ><span class="text-xs text-muted-foreground">{{ dateFull(comment.submitted) }}</span>
          </div>
          <!-- eslint-disable vue/no-v-html -- 댓글 HTML은 useSanitize()로 정제합니다. -->
          <div
            class="nubo mt-2 whitespace-pre-wrap text-sm leading-7"
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
            <Button
              variant="ghost"
              size="sm"
              class="gap-1"
              :disabled="!isLoggedIn"
              @click="likeComment(comment.uid, !comment.liked)"
              ><HeartIcon
                class="size-3.5"
                :class="comment.liked ? 'fill-current text-primary' : ''"
              />{{ comment.like || "좋아요" }}</Button
            >
            <template
              v-if="checkPermissionComment(comment.writer.uid) && comment.content !== '(deleted)'"
              ><Button variant="ghost" size="sm" @click="beginModify(comment.uid, comment.content)"
                >수정</Button
              ><Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
                @click="confirmRemoveComment(comment.uid)"
                >삭제</Button
              ></template
            >
          </div>
        </div>
      </article>
    </div>
    <p
      v-else
      class="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground"
    >
      아직 댓글이 없습니다. 글에 대한 생각을 남겨보세요.
    </p>

    <form
      class="mt-8 rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5"
      @submit.prevent="submitComment"
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
      <Textarea
        v-model="draft"
        class="min-h-28 resize-y bg-background leading-7"
        :disabled="!isLoggedIn || submitting"
        :placeholder="
          isLoggedIn
            ? '글에 대한 생각을 10자 이상 남겨보세요'
            : '로그인 후 댓글을 작성할 수 있습니다'
        "
      />
      <div class="mt-3 flex justify-end">
        <Button type="submit" :disabled="!isLoggedIn || submitting || draft.trim().length < 10"
          ><LoaderCircleIcon v-if="submitting" class="size-4 animate-spin" />{{
            submitLabel
          }}</Button
        >
      </div>
    </form>
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
  HeartIcon,
  LoaderCircleIcon,
  MessageSquareReplyIcon,
} from "lucide-vue-next"
import { useNuboEditorContext } from "~/providers/contexts/editor"
import { useNuboViewContext } from "~/providers/contexts/view"
const { content } = useNuboEditorContext()
const {
  cancelCommentTarget,
  comments,
  commentTarget,
  checkPermissionComment,
  confirmRemoveComment,
  isConfirmRemoveCommentDialog,
  isLoggedIn,
  likeComment,
  modifyExistComment,
  removeComment,
  setModifyComment,
  setReplyComment,
  view,
  writeNewComment,
  writeReplyComment,
} = useNuboViewContext()
const { sanitize } = useSanitize()
const draft = ref("")
const submitting = ref(false)
const replyQuote = ref("")
const escapeText = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replace(/\r?\n/g, "<br>")
const paragraph = (value: string) => `<p>${escapeText(value.trim())}</p>`
const toPlainText = (value: string) =>
  recoverChars(
    stripTags(value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(?:p|div|blockquote)>/gi, "\n")),
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim()
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
const beginReply = (uid: number, existing: string) => {
  setReplyComment(uid, existing)
  replyQuote.value = `<blockquote><p>${escapeText(toPlainText(existing))}</p></blockquote>`
  draft.value = ""
}
const beginModify = (uid: number, existing: string) => {
  setModifyComment(uid, existing)
  draft.value = toPlainText(existing)
  replyQuote.value = ""
}
const cancelTarget = () => {
  cancelCommentTarget()
  draft.value = ""
  replyQuote.value = ""
}
const submitComment = async () => {
  if (!isLoggedIn.value || submitting.value || draft.value.trim().length < 10) return
  submitting.value = true
  try {
    content.value = commentTarget.value.reply
      ? `${replyQuote.value}${paragraph(draft.value)}`
      : paragraph(draft.value)
    const succeeded = commentTarget.value.reply
      ? await writeReplyComment()
      : commentTarget.value.modify
        ? await modifyExistComment()
        : await writeNewComment()
    if (succeeded) {
      draft.value = ""
      replyQuote.value = ""
    }
  } finally {
    submitting.value = false
  }
}
</script>
