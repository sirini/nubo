<template>
  <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
    <header class="mb-9 border-b border-border/60 pb-7">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {{ mode === "write" ? "New story" : "Edit story" }}
      </p>
      <h1 class="mt-3 text-3xl font-semibold tracking-[-0.045em]">
        {{
          mode === "write" ? "생각을 한 편의 글로 엮어보세요" : "이야기를 더 선명하게 다듬어보세요"
        }}
      </h1>
      <p class="mt-3 text-sm text-muted-foreground">
        {{ recoverChars(config.name) }} · {{ recoverChars(config.info) }}
      </p>
    </header>

    <form class="space-y-8" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <label v-if="config.useCategory" class="text-sm font-medium"
          >분류<select
            v-model="categoryUid"
            class="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 font-normal"
          >
            <option :value="0">분류 선택</option>
            <option v-for="category in categories" :key="category.uid" :value="category.uid">
              {{ recoverChars(category.name) }}
            </option>
          </select></label
        >
        <div class="flex items-end gap-5 pb-2 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-2"
            ><Checkbox v-model="isSecret" /> 비밀글</label
          ><label v-if="isAdmin" class="inline-flex cursor-pointer items-center gap-2"
            ><Checkbox v-model="isNotice" /> 공지</label
          >
        </div>
      </div>

      <label class="block"
        ><span class="sr-only">글 제목</span
        ><Textarea
          v-model="title"
          class="min-h-28 resize-none border-0 bg-transparent px-0 text-4xl font-semibold leading-tight tracking-[-0.05em] shadow-none focus-visible:ring-0 sm:text-5xl"
          maxlength="200"
          placeholder="제목"
          required
      /></label>

      <div class="space-y-3">
        <div>
          <h2 class="text-sm font-medium">표지 및 첨부</h2>
          <p class="mt-1 text-xs text-muted-foreground">
            첫 번째 이미지는 목록과 글 상단의 표지로 사용됩니다.
          </p>
        </div>
        <label
          class="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-7 text-center hover:bg-muted/35"
          ><ImageUpIcon class="size-6 text-primary" /><span
            class="mt-2 text-sm text-muted-foreground"
            >이미지나 첨부파일 선택</span
          ><input class="sr-only" type="file" multiple @change="changeFileList"
        /></label>
        <ul v-if="attaches.length" class="grid gap-2 sm:grid-cols-2">
          <li
            v-for="(file, index) in attaches"
            :key="`${file.name}-${index}`"
            class="flex min-w-0 items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
          >
            <span class="truncate">{{ file.name }}</span
            ><Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="선택한 파일 제거"
              @click="removeFromList(index)"
              ><XIcon class="size-4"
            /></Button>
          </li>
        </ul>
        <ul v-if="mode === 'modify' && files.length" class="grid gap-3 sm:grid-cols-2">
          <li
            v-for="(file, index) in files"
            :key="file.uid"
            class="flex min-w-0 items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5"
          >
            <img
              v-if="getUploadedThumbnail(file.uid)"
              :src="getUploadedThumbnail(file.uid)"
              :alt="`${recoverChars(file.name)} 미리보기`"
              class="size-14 shrink-0 rounded-lg object-cover"
            />
            <div
              v-else
              class="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted"
            >
              <PaperclipIcon class="size-4 text-muted-foreground" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ recoverChars(file.name) }}</p>
              <p class="mt-1 text-xs text-muted-foreground">{{ num(file.size) }}B</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="shrink-0 text-destructive"
              :aria-label="`${recoverChars(file.name)} 삭제`"
              @click="confirmRemoveFile(file.uid, index)"
              ><Trash2Icon class="size-4"
            /></Button>
          </li>
        </ul>
      </div>

      <div>
        <h2 class="mb-3 text-sm font-medium">본문</h2>
        <NuboTiptapEditor v-model="content" :config="config" />
      </div>

      <div class="space-y-3">
        <label class="text-sm font-medium" for="advance-blog-tag">태그</label>
        <div class="flex gap-2">
          <Input
            id="advance-blog-tag"
            v-model="tag"
            placeholder="태그 입력 후 Enter"
            @keyup.enter.prevent="addTag"
          /><Button type="button" variant="outline" @click="addTag">추가</Button>
        </div>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="(item, index) in tags"
            :key="`${item}-${index}`"
            variant="secondary"
            class="gap-1"
            >#{{ item
            }}<button
              type="button"
              class="cursor-pointer"
              :aria-label="`${item} 태그 삭제`"
              @click="removeTag(index)"
            >
              <XIcon class="size-3" /></button
          ></Badge>
        </div>
      </div>

      <footer
        class="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6"
      >
        <div class="flex items-center gap-3">
          <Button type="button" variant="ghost" @click="cancel">취소</Button
          ><Button
            v-if="mode === 'write' && isLoadDraft"
            type="button"
            variant="outline"
            @click="loadDraft"
            >임시글 불러오기</Button
          ><span v-if="mode === 'write'" class="text-xs text-muted-foreground">{{
            draftStatus
          }}</span>
        </div>
        <Button type="submit" class="min-w-28" :disabled="isWriting"
          ><LoaderCircleIcon v-if="isWriting" class="size-4 animate-spin" />{{
            mode === "write" ? "발행하기" : "수정하기"
          }}</Button
        >
      </footer>
    </form>
    <CommonVConfirmDialog
      v-model="isConfirmDialog"
      title="기존 첨부 삭제"
      desc="선택한 첨부파일을 글에서 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      cancel-text="그대로 두기"
      confirm-text="삭제하기"
      variant="destructive"
      @confirm="removeAttachedFile()"
    />
  </section>
</template>

<script setup lang="ts">
import { ImageUpIcon, LoaderCircleIcon, PaperclipIcon, Trash2Icon, XIcon } from "lucide-vue-next"
import { useNuboEditorContext } from "~/providers/contexts/editor"
import { useNuboWriteContext } from "~/providers/contexts/write"
import NuboTiptapEditor from "~/components/editor/NuboTiptapEditor.vue"
const props = defineProps<{ mode: "write" | "modify" }>()
const { config, content, isLoadDraft, lastDraftSavedAt, loadDraft } = useNuboEditorContext()
const {
  addTag,
  attaches,
  cancelEditPost,
  cancelNewPost,
  categories,
  categoryUid,
  changeFileList,
  confirmRemoveFile,
  files,
  getUploadedThumbnail,
  isAdmin,
  isConfirmDialog,
  isNotice,
  isSecret,
  isWriting,
  modifyExistPost,
  removeAttachedFile,
  removeFromList,
  removeTag,
  tag,
  tags,
  title,
  writeNewPost,
} = useNuboWriteContext()
const submit = () => (props.mode === "write" ? writeNewPost() : modifyExistPost())
const cancel = () => (props.mode === "write" ? cancelNewPost() : cancelEditPost())
const draftStatus = computed(() =>
  lastDraftSavedAt.value
    ? `자동 저장 ${new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(lastDraftSavedAt.value)}`
    : "입력 내용은 브라우저에 자동 저장됩니다",
)
</script>
