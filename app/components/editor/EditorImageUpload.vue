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
        <TabsList class="grid w-full grid-cols-3 mb-3">
          <TabsTrigger value="upload" class="cursor-pointer"> 업로드 </TabsTrigger>
          <TabsTrigger value="db" @click="edit.loadInsertedImages()" class="cursor-pointer"
            >이전 업로드들</TabsTrigger
          >
          <TabsTrigger value="link" class="cursor-pointer"> URL 추가 </TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <Card class="p-0">
            <CardContent class="flex p-3 max-w-sm items-center gap-2">
              <Input type="file" @change="edit.selectedImages" accept="image/*" multiple />
              <Button
                type="button"
                @click="edit.uploadingImages"
                :disabled="!isReady"
                :variant="isReady ? 'default' : 'outline'"
                class="text-foreground cursor-pointer"
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

        <TabsContent value="db">
          <Card class="p-0">
            <CardContent class="grid grid-cols-3 p-3 gap-2" v-if="edit.insertedImages.length > 0">
              <div
                v-for="(url, index) in edit.insertedImages"
                :key="index"
                class="cursor-pointer relative"
                @click="edit.insertImageToEditor(url.name)"
              >
                <img
                  :src="url.name"
                  alt="Inserted image"
                  class="h-full w-full object-cover rounded-xl aspect-square"
                />

                <CommonVTooltip content="클릭하시면 이 사진을 삭제합니다">
                  <Trash2Icon
                    class="w-5 h-5 absolute right-2 top-2 cursor-pointer text-red-400 z-10"
                  />
                </CommonVTooltip>
              </div>
            </CardContent>
            <CardContent
              class="flex flex-col items-center justify-center py-6 text-muted-foreground text-sm"
              v-else
            >
              <ImageOffIcon class="w-8 h-8 mb-2 opacity-70" />
              <p>올려둔 이미지들이 없습니다</p>
            </CardContent>
            <Button
              variant="link"
              class="w-full rounded-t-none cursor-pointer bg-accent/30"
              @click="edit.loadInsertedImages()"
              >이전 사진들 불러오기 (총 {{ edit.insertedImageResult?.totalImageCount }}장)</Button
            >
          </Card>
        </TabsContent>

        <TabsContent value="link">
          <Card class="p-0">
            <CardContent class="flex p-3 max-w-sm items-center gap-2">
              <Input type="text" placeholder="https://example.com/path/image.jpg" />
              <Button type="button" @click="" class="text-foreground cursor-pointer">추가</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <DialogFooter>
        <DialogClose as-child class="inline-flex">
          <Button
            class="w-full cursor-pointer"
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
import { ImageOffIcon, Trash2Icon } from "lucide-vue-next"

const edit = useEditorStore()
const config = useRuntimeConfig()
const isReady = computed(() => {
  return edit.previewImages.length > 0
})

await edit.loadInsertedImages()
</script>
