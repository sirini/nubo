<template>
  <Dialog v-model:open="admin.isGroupNameChangeDialog">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>그룹명 변경</DialogTitle>
        <DialogDescription>변경하실 그룹명을 입력해보세요</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <div class="relative flex items-center">
            <Input
              id="name"
              v-model="newGroupId"
              placeholder="새 그룹명을 입력하세요"
              class="pr-10"
              auto-focus
            />

            <div class="absolute right-3">
              <CheckCircle2Icon v-if="isAvailable" class="w-4 h-4 text-green-500" />
              <AlertCircleIcon v-else-if="!isValid" class="w-4 h-4 text-red-500" />
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="ghost"
          type="button"
          @click="closeChangeGroupIdDialog"
          class="cursor-pointer"
          >취소</Button
        >
        <Button
          :disabled="!isValid"
          type="submit"
          class="cursor-pointer text-foreground"
          @click="updateGroupId"
        >
          저장
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-vue-next"
import { useNuboAdminContext } from "~/types/nubo-skin-keys"

const admin = useAdminStore()
const newGroupId = ref<string>("")
const isAvailable = ref<boolean>(false)
const isValid = computed(() => newGroupId.value.length > 1)
const { closeChangeGroupIdDialog, changeGroupId, loadInitGroupList, loadSelectedGroupInfo } =
  useNuboAdminContext()

// 그룹 ID값 변경하기
const updateGroupId = async () => {
  isAvailable.value = await changeGroupId(newGroupId.value)
  if (isAvailable.value) {
    loadInitGroupList()
    loadSelectedGroupInfo(newGroupId.value)
    closeChangeGroupIdDialog()
  }
}
</script>
