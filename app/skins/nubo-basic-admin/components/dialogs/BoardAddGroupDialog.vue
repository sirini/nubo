<template>
  <Dialog v-model:open="isAddGroupDialog" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>새 그룹 추가</DialogTitle>
        <DialogDescription>새로 추가하실 게시판 그룹명을 입력하세요</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <div class="relative flex items-center">
            <Input
              id="name"
              v-model="newGroupId"
              placeholder="새 그룹명을 입력하세요"
              auto-focus
              autocomplete="off"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" @click="closeAddGroupDialog" class="cursor-pointer"
          >취소</Button
        >
        <Button
          :disabled="!isValid"
          type="submit"
          class="cursor-pointer text-foreground"
          @click="createNewGroup"
          >추가</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useNuboAdminContext } from "~/providers/contexts/admin"

const newGroupId = ref<string>("")
const isValid = computed(() => newGroupId.value.length > 1)
const { isAddGroupDialog, closeAddGroupDialog, createGroup } = useNuboAdminContext()
const props = defineProps<{ changeGroup: Function }>()

// 새그룹 추가하기
const createNewGroup = async () => {
  if (isValid.value) {
    await createGroup(newGroupId.value)
    props.changeGroup()
  }
  closeAddGroupDialog()
}

// 다이얼로그 창 상태 변화 확인
const handleOpenChange = (open: boolean) => {
  if (!open) {
    newGroupId.value = ""
    closeAddGroupDialog()
  }
}
</script>
