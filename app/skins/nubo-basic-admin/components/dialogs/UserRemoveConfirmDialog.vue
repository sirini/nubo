<template>
  <Dialog v-model:open="isUserRemoveConfirmDialog" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>사용자 계정 삭제</DialogTitle>
        <DialogDescription>{{ targetUser.name }} 사용자 계정을 삭제합니다</DialogDescription>
      </DialogHeader>

      <div class="py-4 space-y-2">
        <p>
          ⚠️ 정말로 <strong class="text-primary">{{ targetUser.name }}</strong> 사용자 계정을 삭제
          하시겠습니까?
        </p>
        <p>
          {{ targetUser.name }} 사용자가 남긴 게시글들의 작성자는 "leaved"로 표기되며, 해당 사용자는
          더 이상 로그인을 할 수 없습니다.
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          class="cursor-pointer"
          @click="closeUserRemoveConfirmDialog"
          >취소</Button
        >

        <CommonVTooltip
          :content="`주의사항을 확인하였고 ${targetUser.name} 계정 삭제를 진행합니다`"
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

const props = defineProps<{
  changePanel: (panel: "list" | "new" | "edit", userUid?: number) => Promise<void>
}>()
const { targetUser, isUserRemoveConfirmDialog, closeUserRemoveConfirmDialog, removeUser } =
  useNuboAdminContext()

// 다이얼로그 창 상태 변화 확인
const handleOpenChange = (open: boolean) => {
  if (!open) {
    closeUserRemoveConfirmDialog()
  }
}

// 사용자 계정 삭제하기
const remove = async () => {
  await removeUser()
  closeUserRemoveConfirmDialog()
  await props.changePanel("list")
}
</script>
