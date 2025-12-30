<template>
  <section class="container mx-auto py-4">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <Card>
        <CardHeader>
          <CardTitle>글 수정하기</CardTitle>
          <CardDescription>{{ config.name }} : {{ config.info }}</CardDescription>
        </CardHeader>

        <CardContent class="space-y-4">
          <EditorPostOptions />
          <EditorDragDropUpload />
          <EditorDragDropUploadedFiles />
          <EditorTitle />
          <EditorTiptapEditor v-model="content" :config="config" />
          <EditorHashtag />
        </CardContent>

        <CardFooter class="flex justify-between items-center border-t">
          <CommonVTooltip content="클릭하시면 수정 작업을 취소합니다 (원본글 보존)">
            <Button variant="outline" @click="$router.back()" class="cursor-pointer">취소</Button>
          </CommonVTooltip>

          <CommonVTooltip content="제출하시기 전에 수정된 글내용을 다시 한 번 살펴봐주세요">
            <Button @click="modifyExistPost" class="text-foreground cursor-pointer"
              >제출하기</Button
            >
          </CommonVTooltip>
        </CardFooter>
      </Card>

      <CommonVLoadingDialog v-model="isWriting" message="게시글을 수정하고 있습니다" />
      <CommonVConfirmDialog
        v-model="isConfirmDialog"
        title="첨부파일 삭제"
        desc="정말로 선택하신 첨부파일을 삭제하시겠습니까?"
        cancel-text="그대로 두기"
        confirm-text="삭제하기"
        variant="destructive"
        @confirm="removeAttachedFile"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useNuboEditorContext, useNuboWriteContext } from "~/types/nubo-skin-keys"
import EditorDragDropUpload from "./components/EditorDragDropUpload.vue"
import EditorDragDropUploadedFiles from "./components/EditorDragDropUploadedFiles.vue"
import EditorHashtag from "./components/EditorHashtag.vue"
import EditorPostOptions from "./components/EditorPostOptions.vue"
import EditorTiptapEditor from "./components/EditorTiptapEditor.vue"
import EditorTitle from "./components/EditorTitle.vue"

const { config, content } = useNuboEditorContext()
const { isConfirmDialog, isWriting, modifyExistPost, removeAttachedFile } = useNuboWriteContext()
</script>
