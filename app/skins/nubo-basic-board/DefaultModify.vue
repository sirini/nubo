<template>
  <section class="container mx-auto py-6">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <Card>
        <CardHeader>
          <CardTitle>글 수정하기</CardTitle>
          <CardDescription>{{ config.name }} : {{ config.info }}</CardDescription>
        </CardHeader>

        <CardContent class="space-y-4">
          <WritePostOptions />
          <WriteDragDropUpload />
          <WriteDragDropUploadedFiles />
          <WriteTitle />
          <WriteTiptapEditor v-model="content" :config="config" />
          <WriteHashtag />
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
    </div>
    <CommonVConfirmDialog
      v-model="isConfirmDialog"
      title="첨부파일 삭제"
      desc="정말로 선택하신 첨부파일을 삭제하시겠습니까?"
      cancel-text="그대로 두기"
      confirm-text="삭제하기"
      variant="destructive"
      @confirm="removeAttachedFile()"
    />
    <CommonVLoadingDialog
      v-if="!isConfirmDialog"
      v-model="isWriting"
      message="게시글을 수정하고 있습니다"
    />
  </section>
</template>

<script setup lang="ts">
import { useNuboEditorContext } from "~/providers/contexts/editor"
import { useNuboWriteContext } from "~/providers/contexts/write"
import WriteDragDropUpload from "./components/write/WriteDragDropUpload.vue"
import WriteDragDropUploadedFiles from "./components/write/WriteDragDropUploadedFiles.vue"
import WriteHashtag from "./components/write/WriteHashtag.vue"
import WritePostOptions from "./components/write/WritePostOptions.vue"
import WriteTiptapEditor from "./components/write/WriteTiptapEditor.vue"
import WriteTitle from "./components/write/WriteTitle.vue"

const { config, content } = useNuboEditorContext()
const { isConfirmDialog, isWriting, modifyExistPost, removeAttachedFile } = useNuboWriteContext()
</script>
