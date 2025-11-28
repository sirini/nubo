<template>
  <section class="container mx-auto py-4">
    <Card>
      <CardHeader>
        <CardTitle>글 수정하기</CardTitle>
        <CardDescription>{{ edit.config.name }} : {{ edit.config.info }}</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <EditorPostOptions />
        <EditorDragDropUpload />
        <EditorTitle />
        <EditorTiptapEditor v-model="edit.content" :config="edit.config" />
        <EditorHashtag />
      </CardContent>

      <CardFooter class="flex justify-between items-center border-t">
        <CommonVTooltip content="클릭하시면 수정 작업을 취소합니다 (원본글 보존)">
          <Button variant="outline" @click="$router.back()" class="cursor-pointer">취소</Button>
        </CommonVTooltip>

        <CommonVTooltip content="제출하시기 전에 수정된 글내용을 다시 한 번 살펴봐주세요">
          <Button @click="edit.modify(postUid)" class="text-foreground cursor-pointer"
            >제출하기</Button
          >
        </CommonVTooltip>
      </CardFooter>
    </Card>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" as never })

const route = useRoute()
const edit = useEditorStore()
const boardId = route.params.id as string
const postUid = computed(() => parseInt(route.params.postUid as string))

await edit.loadBoardConfig(boardId)

onMounted(() => {
  edit.loadPost(postUid.value)
})
</script>
