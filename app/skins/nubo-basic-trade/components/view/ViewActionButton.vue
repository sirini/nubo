<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="lg" class="cursor-pointer" :disabled="!isLoggedIn">
        <EllipsisVerticalIcon />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        class="cursor-pointer flex items-center gap-3"
        :disabled="!isWriter && !isAdmin"
        @click="navigateTo(`/board/${view.config.id}/${view.post.uid}/edit`)"
      >
        <EraserIcon class="w-4 h-4" />
        수정
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="isAdmin && view.config.type !== BOARD.TRADE"
        class="cursor-pointer flex items-center gap-3"
        @click="openMovePostDialog"
      >
        <ArrowRightLeftIcon class="w-4 h-4" />
        이동
      </DropdownMenuItem>
      <DropdownMenuItem
        class="cursor-pointer text-destructive focus:text-destructive flex items-center gap-3"
        :disabled="!isWriter && !isAdmin"
        @click="confirmRemovePost(view.post.uid)"
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
  <ViewMovePostDialog />
</template>

<script setup lang="ts">
import { ArrowRightLeftIcon, EllipsisVerticalIcon, EraserIcon, ShredderIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"
import { BOARD } from "~/types/board"
import ViewMovePostDialog from "./ViewMovePostDialog.vue"

const {
  isLoggedIn,
  isWriter,
  isAdmin,
  isConfirmRemovePostDialog,
  view,
  confirmRemovePost,
  openMovePostDialog,
  remove,
} = useNuboViewContext()
</script>
