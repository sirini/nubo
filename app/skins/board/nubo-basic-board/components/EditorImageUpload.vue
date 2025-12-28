<template>
  <Dialog v-model:open="isImageUploadDialog">
    <DialogContent class="w-100 p-4">
      <DialogHeader>
        <DialogTitle>이미지 추가</DialogTitle>
        <DialogDescription>
          <p>이미지 파일을 업로드 하거나, URL을 추가합니다.</p>
          <p>업로드 시 {{ imageSizeLimit.contentInsert }}px 보다 큰 이미지는 리사이즈 됩니다.</p>
        </DialogDescription>
      </DialogHeader>
      <Tabs default-value="upload">
        <TabsList class="grid w-full grid-cols-3 mb-3">
          <TabsTrigger value="upload" class="cursor-pointer"> 업로드 </TabsTrigger>
          <TabsTrigger
            value="db"
            @click="loadInsertedImages({ reset: true })"
            class="cursor-pointer"
            >이전 업로드들</TabsTrigger
          >
          <TabsTrigger value="link" class="cursor-pointer"> URL 추가 </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card class="p-0">
            <CardContent class="flex p-3 max-w-sm items-center gap-2">
              <Input type="file" @change="changeSelectedImages" accept="image/*" multiple />
              <Button
                type="button"
                @click="uploadingImages"
                :variant="previewInsertImages.length > 0 ? 'default' : 'outline'"
                :disabled="isUploading"
                class="text-foreground cursor-pointer flex items-center gap-2"
              >
                <Spinner v-if="isUploading" />
                업로드
              </Button>
            </CardContent>
            <CardContent class="grid grid-cols-3 p-3 gap-2" v-show="previewInsertImages.length > 0">
              <div v-for="(url, index) in previewInsertImages" :key="index">
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
            <CardContent class="grid grid-cols-3 p-3 gap-2" v-if="insertedImages.length > 0">
              <div
                v-for="(url, index) in insertedImages"
                :key="index"
                class="cursor-pointer relative"
                @click="insertImageToEditor(url.name)"
              >
                <img
                  :src="url.name"
                  alt="Inserted image"
                  class="h-full w-full object-cover rounded-xl aspect-square"
                />

                <CommonVTooltip
                  content="클릭하시면 이 사진을 삭제합니다 : (주의) 기존 게시글에 삽입된 이미지들은 더 이상 표시되지 않습니다"
                >
                  <Trash2Icon
                    @click.stop="deleteInsertedImage(url.uid)"
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
              @click="loadInsertedImages()"
              >이전 사진들 불러오기 (총 {{ insertedImageResult?.totalImageCount }}장)</Button
            >
          </Card>
        </TabsContent>

        <TabsContent value="link">
          <Card class="p-0">
            <CardContent class="flex p-3 max-w-sm items-center gap-2">
              <Input
                type="text"
                v-model="imageUrl"
                placeholder="https://example.com/path/image.jpg"
              />
              <Button
                type="button"
                @click="insertImageToEditor(imageUrl)"
                class="text-foreground cursor-pointer"
                >추가</Button
              >
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
            @click="isImageUploadDialog = false"
            >닫기</Button
          >
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ImageOffIcon, Trash2Icon } from "lucide-vue-next"
import { useNuboEditorContext, useNuboWriteContext } from "~/types/nubo-skin-keys"

const {
  imageSizeLimit,
  isImageUploadDialog,
  isUploading,
  previewInsertImages,
  insertedImages,
  insertedImageResult,
  imageUrl,
  loadInsertedImages,
  uploadingImages,
  insertImageToEditor,
  deleteInsertedImage,
} = useNuboEditorContext()

const { changeSelectedImages } = useNuboWriteContext()
</script>
