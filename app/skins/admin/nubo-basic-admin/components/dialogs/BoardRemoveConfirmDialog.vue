<template>
  <Dialog v-model:open="isBoardRemoveConfirmDialog" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>게시판 삭제</DialogTitle>
        <DialogDescription>{{ targetBoard.name }} 게시판을 삭제합니다</DialogDescription>
      </DialogHeader>

      <div class="py-4 space-y-2">
        <p>
          ⚠️ 정말로 <strong class="text-primary">{{ targetBoard.name }}</strong> 게시판을 삭제
          하시겠습니까?
        </p>
        <ul class="py-2">
          <li class="list-disc pl-2 ml-6">첨부된 모든 파일들 삭제</li>
          <li class="list-disc pl-2 ml-6">삽입된 모든 이미지들 삭제</li>
          <li class="list-disc pl-2 ml-6">남겨진 게시글/댓글 삭제</li>
          <li class="list-disc pl-2 ml-6">카테고리들 삭제</li>
          <li class="list-disc pl-2 ml-6">
            복구 불가 (작업 전에 미리 <strong class="text-primary">백업 권장</strong>)
          </li>
        </ul>
        <p>게시글/댓글 및 삭제할 이미지/파일들이 많을 경우 작업에 시간이 걸립니다.</p>
        <p>
          가급적 이용자가 적은 새벽 시간대에 삭제하거나,
          <strong class="text-primary">서버 점검 시점에 삭제</strong>하시는 걸 권장합니다.
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          @click="closeBoardRemoveConfirmDialog"
          class="cursor-pointer"
          >취소</Button
        >

        <CommonVTooltip
          :content="`주의사항을 확인하였고 ${targetBoard.name} 게시판 삭제를 진행합니다`"
        >
          <Button
            type="submit"
            variant="destructive"
            class="cursor-pointer text-foreground gap-2"
            @click="remove"
          >
            <Trash2Icon class="w-4 h-4" />
            <span>삭제</span>
          </Button>
        </CommonVTooltip>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Trash2Icon } from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"

const props = defineProps<{ changePanel: Function }>()
const { isBoardRemoveConfirmDialog, targetBoard, closeBoardRemoveConfirmDialog, removeBoard } =
  useNuboAdminContext()

// 다이얼로그 창 상태 변화 확인
const handleOpenChange = (open: boolean) => {
  if (!open) {
    closeBoardRemoveConfirmDialog()
  }
}

// 게시판 삭제하기
const remove = async () => {
  await removeBoard()
  closeBoardRemoveConfirmDialog()
  props.changePanel("list")
}
</script>
