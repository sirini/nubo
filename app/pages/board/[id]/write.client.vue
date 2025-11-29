<template>
  <section class="container mx-auto py-4">
    <Card>
      <CardHeader>
        <CardTitle>새글쓰기</CardTitle>
        <CardDescription>{{ edit.config.name }} : {{ edit.config.info }}</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <EditorPostOptions />
        <EditorDragDropUpload />
        <EditorDragDropUploadedFiles />
        <EditorTitle />
        <EditorTiptapEditor v-model="edit.content" :config="edit.config" />
        <EditorHashtag />
      </CardContent>

      <CardFooter class="flex justify-between items-center border-t">
        <CommonVTooltip content="클릭하시면 작성하시던 내용은 모두 삭제됩니다">
          <Button variant="outline" @click="$router.back()" class="cursor-pointer">취소</Button>
        </CommonVTooltip>

        <CommonVTooltip content="제출하시기 전에 글내용을 다시 한 번 살펴봐주세요">
          <Button @click="edit.submit" class="text-foreground cursor-pointer">제출하기</Button>
        </CommonVTooltip>
      </CardFooter>
    </Card>

    <CommonVLoadingDialog message="게시글을 저장하고 있습니다" />
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" as never })

const route = useRoute()
const edit = useEditorStore()
const boardId = route.params.id as string

await edit.loadBoardConfig(boardId)
</script>
