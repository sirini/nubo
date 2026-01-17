<template>
  <section class="container mx-auto py-6">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <Card>
        <CardHeader>
          <CardTitle>새글쓰기</CardTitle>
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
          <CommonVTooltip content="클릭하시면 작성하시던 내용은 모두 삭제됩니다">
            <Button variant="outline" @click="$router.back()" class="cursor-pointer">취소</Button>
          </CommonVTooltip>

          <CommonVTooltip content="제출하시기 전에 글내용을 다시 한 번 살펴봐주세요">
            <Button @click="writeNewPost" class="text-foreground cursor-pointer">제출하기</Button>
          </CommonVTooltip>
        </CardFooter>
      </Card>

      <CommonVLoadingDialog v-model="isWriting" message="게시글을 저장하고 있습니다" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useNuboEditorContext, useNuboWriteContext } from "~/types/nubo-skin-keys"
import WriteDragDropUpload from "./components/write/WriteDragDropUpload.vue"
import WriteDragDropUploadedFiles from "./components/write/WriteDragDropUploadedFiles.vue"
import WriteHashtag from "./components/write/WriteHashtag.vue"
import WritePostOptions from "./components/write/WritePostOptions.vue"
import WriteTiptapEditor from "./components/write/WriteTiptapEditor.vue"
import WriteTitle from "./components/write/WriteTitle.vue"

const { isWriting, writeNewPost } = useNuboWriteContext()
const { content, config } = useNuboEditorContext()
</script>
