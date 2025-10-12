<template>
  <Dialog v-model:open="edit.isAddLinkDialog">
    <DialogContent class="w-100 p-4">
      <DialogTitle>링크 추가</DialogTitle>
      <DialogDescription>
        <p>선택한 텍스트에 링크 URL을 추가/제거 합니다.</p>
      </DialogDescription>

      <Card class="p-0">
        <CardContent class="flex p-3 max-w-sm items-center gap-2">
          <Input type="url" v-model="url" placeholder="https://example.com/sample/url" />
          <Button type="button" @click="edit.setLink(url)" variant="secondary" v-if="url.length > 0"
            >추가</Button
          >
          <Button type="button" @click="edit.setLink(url)" variant="destructive" v-else
            >제거</Button
          >
        </CardContent>
      </Card>
    </DialogContent>
    <DialogFooter>
      <DialogClose as-child class="inline-flex">
        <Button class="w-full" type="button" variant="outline" @click="edit.isAddLinkDialog = false"
          >닫기</Button
        >
      </DialogClose>
    </DialogFooter>
  </Dialog>
</template>

<script setup lang="ts">
const edit = useEditorStore()
const url = ref<string>("")
</script>
