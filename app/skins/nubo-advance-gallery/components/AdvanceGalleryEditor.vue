<template>
  <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
    <header class="mb-8 border-b border-border/60 pb-7">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {{ mode === "write" ? "New photograph" : "Edit story" }}
      </p>
      <h1 class="mt-3 text-3xl font-semibold tracking-[-0.04em]">
        {{ mode === "write" ? "사진과 이야기를 올려보세요" : "사진 이야기를 다듬어보세요" }}
      </h1>
      <p class="mt-3 text-sm text-muted-foreground">
        {{ recoverChars(config.name) }} · {{ recoverChars(config.info) }}
      </p>
    </header>

    <form class="space-y-8" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <label v-if="config.useCategory" class="space-y-2 text-sm font-medium"
          >분류
          <select
            v-model="categoryUid"
            class="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 font-normal"
          >
            <option :value="0">분류 선택</option>
            <option v-for="category in categories" :key="category.uid" :value="category.uid">
              {{ recoverChars(category.name) }}
            </option>
          </select>
        </label>
        <div class="flex items-end gap-5 pb-2 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-2"
            ><Checkbox v-model="isSecret" /> 비밀글</label
          >
          <label v-if="isAdmin" class="inline-flex cursor-pointer items-center gap-2"
            ><Checkbox v-model="isNotice" /> 공지</label
          >
        </div>
      </div>

      <label class="block space-y-2 text-sm font-medium"
        >제목
        <Input
          v-model="title"
          class="mt-2 h-12 text-lg"
          maxlength="200"
          placeholder="사진의 제목을 입력하세요"
          required
        />
      </label>

      <label class="block space-y-3 text-sm font-medium"
        >사진 파일
        <div
          class="mt-2 rounded-2xl border border-dashed border-border bg-muted/25 p-6 text-center"
        >
          <ImageUpIcon class="mx-auto size-7 text-primary" />
          <p class="mt-3 text-sm text-muted-foreground">
            원본 사진을 선택하세요. 목록과 본문용 파생 이미지는 NUBO가 만듭니다.
          </p>
          <input
            class="mt-4 block w-full cursor-pointer text-sm"
            type="file"
            accept="image/*"
            multiple
            @change="changeFileList"
          />
        </div>
      </label>

      <ul v-if="attaches.length" class="grid gap-2 sm:grid-cols-2">
        <li
          v-for="(file, index) in attaches"
          :key="`${file.name}-${index}`"
          class="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
        >
          <span class="truncate">{{ file.name }}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="선택한 파일 제거"
            @click="removeFromList(index)"
            ><XIcon class="size-4"
          /></Button>
        </li>
      </ul>

      <div v-if="mode === 'modify' && files.length" class="space-y-3">
        <div>
          <h2 class="text-sm font-medium">기존 사진</h2>
          <p class="mt-1 text-xs text-muted-foreground">
            삭제하면 즉시 게시물에서 제거되며 되돌릴 수 없습니다.
          </p>
        </div>
        <ul class="grid gap-3 sm:grid-cols-2">
          <li
            v-for="(file, index) in files"
            :key="file.uid"
            class="flex min-w-0 items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5"
          >
            <img
              v-if="getUploadedThumbnail(file.uid)"
              :src="getUploadedThumbnail(file.uid)"
              :alt="`${recoverChars(file.name)} 미리보기`"
              class="size-16 shrink-0 rounded-lg object-cover"
            />
            <div
              v-else
              class="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground"
            >
              사진
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

      <div class="space-y-2">
        <p class="text-sm font-medium">이야기</p>
        <NuboTiptapEditor v-model="content" :config="config" />
      </div>

      <div class="space-y-3">
        <label class="text-sm font-medium" for="advance-gallery-tag">태그</label>
        <div class="flex gap-2">
          <Input
            id="advance-gallery-tag"
            v-model="tag"
            placeholder="태그 입력 후 Enter"
            @keyup.enter.prevent="addTag"
          />
          <Button type="button" variant="outline" @click="addTag">추가</Button>
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

      <footer class="flex items-center justify-between border-t border-border/60 pt-6">
        <Button type="button" variant="ghost" @click="cancel">취소</Button>
        <Button type="submit" class="min-w-28" :disabled="isWriting"
          ><LoaderCircleIcon v-if="isWriting" class="size-4 animate-spin" />{{
            mode === "write" ? "게시하기" : "수정하기"
          }}</Button
        >
      </footer>
    </form>

    <CommonVConfirmDialog
      v-model="isConfirmDialog"
      title="기존 사진 삭제"
      desc="선택한 사진을 게시물에서 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      cancel-text="그대로 두기"
      confirm-text="삭제하기"
      variant="destructive"
      @confirm="removeAttachedFile()"
    />
  </section>
</template>

<script setup lang="ts">
import { ImageUpIcon, LoaderCircleIcon, Trash2Icon, XIcon } from "lucide-vue-next"
import NuboTiptapEditor from "~/components/editor/NuboTiptapEditor.vue"
import { useNuboEditorContext } from "~/providers/contexts/editor"
import { useNuboWriteContext } from "~/providers/contexts/write"

const props = defineProps<{ mode: "write" | "modify" }>()
const { config, content } = useNuboEditorContext()
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
</script>
