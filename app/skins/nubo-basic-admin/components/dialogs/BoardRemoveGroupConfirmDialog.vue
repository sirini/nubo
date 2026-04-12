<template>
  <Dialog v-model:open="isGroupRemoveConfirmDialog" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>그룹 삭제</DialogTitle>
        <DialogDescription>{{ targetGroup.name }} 그룹을 삭제합니다</DialogDescription>
      </DialogHeader>

      <div class="py-4 space-y-4">
        <p>
          정말로 <strong class="text-primary">{{ targetGroup.name }}</strong> 그룹을
          삭제하시겠습니까?
        </p>
        <p>
          소속 게시판들은 <strong class="text-primary">기본 그룹 소속으로 변경</strong>되며,
          게시글/댓글이 삭제되거나 게시판들의 접속 경로가 변경되진 않습니다.
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          @click="closeGroupRemoveConfirmDialog"
          class="cursor-pointer"
          >취소</Button
        >

        <CommonVTooltip
          content="소속 게시판들은 기본 그룹으로 변경될 뿐, 다른 작업은 일어나지 않으므로 안심하세요!"
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
const { isGroupRemoveConfirmDialog, targetGroup, closeGroupRemoveConfirmDialog, removeGroup } =
  useNuboAdminContext()

// 다이얼로그 창 상태 변화 확인
const handleOpenChange = (open: boolean) => {
  if (!open) {
    closeGroupRemoveConfirmDialog()
  }
}

// 그룹 삭제하기
const remove = async () => {
  await removeGroup()
  closeGroupRemoveConfirmDialog()
  props.changePanel("list")
}
</script>
