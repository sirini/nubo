<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="lg" class="cursor-pointer" :disabled="!isLoggedIn">
        <EllipsisVerticalIcon />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        @click="navigateTo(`/board/${view.config.id}/${view.post.uid}/edit`)"
        class="cursor-pointer flex items-center gap-3"
        :disabled="!isWriter && !isAdmin"
      >
        <EraserIcon class="w-4 h-4" />
        수정
      </DropdownMenuItem>
      <DropdownMenuItem
        @click="confirmRemovePost(view.post.uid)"
        class="cursor-pointer text-destructive focus:text-destructive flex items-center gap-3"
        :disabled="!isWriter && !isAdmin"
      >
        <ShredderIcon class="w-4 h-4" />
        삭제
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <CommonVConfirmDialog
    v-model="isConfirmRemovePostDialog"
    title="게시글 삭제"
    desc="정말로 현재 게시글을 삭제하시겠습니까?"
    cancel-text="그대로 두기"
    confirm-text="삭제하기"
    variant="destructive"
    @confirm="remove(view.config.uid, view.post.uid)"
  />
</template>

<script setup lang="ts">
import { EllipsisVerticalIcon, EraserIcon, ShredderIcon } from "lucide-vue-next"
import CommonVConfirmDialog from "~/components/common/CommonVConfirmDialog.vue"
import { useNuboViewContext } from "~/providers/contexts/view"

const {
  isLoggedIn,
  isWriter,
  isAdmin,
  isConfirmRemovePostDialog,
  view,
  confirmRemovePost,
  remove,
} = useNuboViewContext()
</script>
