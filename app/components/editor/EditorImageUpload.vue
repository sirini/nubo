<template>
  <Dialog v-model:open="edit.isImageUploadDialog">
    <DialogContent class="w-100 p-4">
      <DialogTitle>이미지 추가</DialogTitle>
      <DialogDescription>
        <p>이미지 파일을 업로드 하거나, URL을 추가합니다.</p>
        <p>
          업로드 시 {{ config.public.imageSize.contentInsert }}px 보다 큰 이미지는 리사이즈 됩니다.
        </p>
      </DialogDescription>
      <Tabs default-value="upload">
        <TabsList class="grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="upload"> 이미지 파일 업로드 </TabsTrigger>
          <TabsTrigger value="link"> URL 링크 추가 </TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <Card class="p-0">
            <CardContent class="flex p-3 max-w-sm items-center gap-2">
              <Input type="file" @change="edit.selectedFiles" accept="image/*" multiple />
              <Button
                type="button"
                @click=""
                :disabled="!isReady"
                :variant="isReady ? 'secondary' : 'outline'"
                >업로드</Button
              >
            </CardContent>
            <CardContent class="grid grid-cols-3 p-3 gap-2" v-show="edit.previewImages.length > 0">
              <div v-for="(url, index) in edit.previewImages" :key="index">
                <img
                  :src="url"
                  alt="Preview image"
                  class="h-full w-full object-cover rounded-xl aspect-square"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link">
          <Card class="p-0">
            <CardContent class="flex p-3 max-w-sm items-center gap-2">
              <Input type="text" placeholder="https://example.com/path/image.jpg" />
              <Button type="button" @click="">추가</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <DialogFooter>
        <DialogClose as-child class="inline-flex">
          <Button
            class="w-full"
            type="button"
            variant="outline"
            @click="edit.isImageUploadDialog = false"
            >닫기</Button
          >
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useEditorStore, useRuntimeConfig } from "#imports"

const edit = useEditorStore()
const config = useRuntimeConfig()
const isReady = computed(() => {
  return edit.previewImages.length > 0
})
</script>
