<template>
  <Dialog v-model:open="isAddLinkDialog">
    <DialogContent class="w-100 p-4">
      <DialogHeader>
        <DialogTitle>링크 추가</DialogTitle>
        <DialogDescription>
          <p>선택한 텍스트에 링크 URL을 추가/제거 합니다.</p>
        </DialogDescription>
      </DialogHeader>

      <Card class="p-0">
        <CardContent class="flex p-3 max-w-sm items-center gap-2">
          <Input v-model="url" type="url" placeholder="https://example.com/sample/url" />
          <Button v-if="url.length > 0" type="button" variant="secondary" @click="setLink(url)"
            >추가</Button
          >
          <Button v-else type="button" variant="destructive" @click="setLink(url)">제거</Button>
        </CardContent>
      </Card>

      <DialogFooter>
        <DialogClose as-child class="inline-flex">
          <Button
            class="w-full cursor-pointer"
            type="button"
            variant="outline"
            @click="isAddLinkDialog = false"
            >닫기</Button
          >
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useNuboEditorContext } from "~/providers/contexts/editor"

const url = ref<string>("")
const { isAddLinkDialog, setLink } = useNuboEditorContext()
</script>
