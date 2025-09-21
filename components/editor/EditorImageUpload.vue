<template>
  <Dialog v-model:open="edit.isUploadingImages">
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
            <CardContent class="pt-3 px-3">
              <Input type="file" @change="" accept="image/*" multiple />
            </CardContent>
            <CardFooter class="pb-3 px-3">
              <Button class="w-full" type="button" @click="">업로드 하고 추가하기</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="link">
          <Card class="p-0">
            <CardContent class="pt-3 px-3">
              <Input type="text" />
            </CardContent>
            <CardFooter class="pb-3 px-3">
              <Button class="w-full" type="button" @click="">URL 추가하기</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <DialogFooter>
        <DialogClose as-child class="inline-flex">
          <Button class="w-full" type="button" variant="outline">닫기</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useEditorStore, useRuntimeConfig } from "#imports"

const edit = useEditorStore()
const config = useRuntimeConfig()
</script>
