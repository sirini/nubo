<template>
  <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
    <header class="mb-8 border-b border-border/60 pb-7">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{{ mode === 'write' ? 'New photograph' : 'Edit story' }}</p>
      <h1 class="mt-3 text-3xl font-semibold tracking-[-0.04em]">{{ mode === 'write' ? '사진과 이야기를 올려보세요' : '사진 이야기를 다듬어보세요' }}</h1>
      <p class="mt-3 text-sm text-muted-foreground">{{ recoverChars(config.name) }} · {{ recoverChars(config.info) }}</p>
    </header>

    <form class="space-y-8" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <label v-if="config.useCategory" class="space-y-2 text-sm font-medium">분류
          <select v-model="categoryUid" class="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 font-normal">
            <option :value="0">분류 선택</option>
            <option v-for="category in categories" :key="category.uid" :value="category.uid">{{ recoverChars(category.name) }}</option>
          </select>
        </label>
        <div class="flex items-end gap-5 pb-2 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-2"><Checkbox v-model="isSecret" /> 비밀글</label>
          <label v-if="isAdmin" class="inline-flex cursor-pointer items-center gap-2"><Checkbox v-model="isNotice" /> 공지</label>
        </div>
      </div>

      <label class="block space-y-2 text-sm font-medium">제목
        <Input v-model="title" class="mt-2 h-12 text-lg" maxlength="200" placeholder="사진의 제목을 입력하세요" required />
      </label>

      <label class="block space-y-3 text-sm font-medium">사진 파일
        <div class="mt-2 rounded-2xl border border-dashed border-border bg-muted/25 p-6 text-center">
          <ImageUpIcon class="mx-auto size-7 text-primary" />
          <p class="mt-3 text-sm text-muted-foreground">원본 사진을 선택하세요. 목록과 본문용 파생 이미지는 NUBO가 만듭니다.</p>
          <input class="mt-4 block w-full cursor-pointer text-sm" type="file" accept="image/*" multiple @change="changeFileList" />
        </div>
      </label>

      <ul v-if="attaches.length" class="grid gap-2 sm:grid-cols-2">
        <li v-for="(file, index) in attaches" :key="`${file.name}-${index}`" class="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
          <span class="truncate">{{ file.name }}</span>
          <Button type="button" variant="ghost" size="icon" aria-label="선택한 파일 제거" @click="removeFromList(index)"><XIcon class="size-4" /></Button>
        </li>
      </ul>
      <p v-if="mode === 'modify'" class="text-xs text-muted-foreground">기존 사진은 그대로 유지됩니다. 기존 첨부 삭제 기능은 다음 편집 고도화 단계에서 추가합니다.</p>

      <label class="block space-y-2 text-sm font-medium">이야기
        <Textarea v-model="content" class="mt-2 min-h-64 resize-y leading-7" placeholder="사진을 찍은 순간과 장소, 생각을 기록해보세요" />
      </label>

      <div class="space-y-3">
        <label class="text-sm font-medium" for="advance-gallery-tag">태그</label>
        <div class="flex gap-2">
          <Input id="advance-gallery-tag" v-model="tag" placeholder="태그 입력 후 Enter" @keyup.enter.prevent="addTag" />
          <Button type="button" variant="outline" @click="addTag">추가</Button>
        </div>
        <div class="flex flex-wrap gap-2">
          <Badge v-for="(item, index) in tags" :key="`${item}-${index}`" variant="secondary" class="gap-1">#{{ item }}<button type="button" class="cursor-pointer" :aria-label="`${item} 태그 삭제`" @click="removeTag(index)"><XIcon class="size-3" /></button></Badge>
        </div>
      </div>

      <footer class="flex items-center justify-between border-t border-border/60 pt-6">
        <Button type="button" variant="ghost" @click="cancel">취소</Button>
        <Button type="submit" class="min-w-28" :disabled="isWriting"><LoaderCircleIcon v-if="isWriting" class="size-4 animate-spin" />{{ mode === 'write' ? '게시하기' : '수정하기' }}</Button>
      </footer>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ImageUpIcon, LoaderCircleIcon, XIcon } from "lucide-vue-next"
import { useNuboEditorContext } from "~/providers/contexts/editor"
import { useNuboWriteContext } from "~/providers/contexts/write"

const props = defineProps<{ mode: 'write' | 'modify' }>()
const { config, content } = useNuboEditorContext()
const { addTag, attaches, cancelEditPost, cancelNewPost, categories, categoryUid, changeFileList, isAdmin, isNotice, isSecret, isWriting, modifyExistPost, removeFromList, removeTag, tag, tags, title, writeNewPost } = useNuboWriteContext()
const submit = () => props.mode === 'write' ? writeNewPost() : modifyExistPost()
const cancel = () => props.mode === 'write' ? cancelNewPost() : cancelEditPost()
</script>
