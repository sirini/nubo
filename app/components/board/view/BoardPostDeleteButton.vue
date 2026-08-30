<template>
  <Button
    v-if="isWriter || isAdmin"
    variant="outline"
    class="gap-2 text-destructive hover:text-destructive"
    @click="confirmRemovePost(view.post.uid)"
  >
    <Trash2Icon class="size-4" />
    삭제
  </Button>

  <CommonVConfirmDialog
    v-model="isConfirmRemovePostDialog"
    title="게시글 삭제"
    desc="정말로 현재 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    cancel-text="그대로 두기"
    confirm-text="삭제하기"
    variant="destructive"
    @confirm="remove(view.config.uid, view.post.uid)"
  />
</template>

<script setup lang="ts">
import { Trash2Icon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const {
  confirmRemovePost,
  isAdmin,
  isConfirmRemovePostDialog,
  isWriter,
  remove,
  view,
} = useNuboViewContext()
</script>
