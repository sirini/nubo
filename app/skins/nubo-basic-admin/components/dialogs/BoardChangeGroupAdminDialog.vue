<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child><Button variant="outline" size="icon" title="그룹 관리자 변경"><UserCogIcon class="size-4" /></Button></DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>그룹 관리자 변경</DialogTitle><DialogDescription>{{ groupInfo.config.id }} 그룹을 관리할 사용자를 선택합니다.</DialogDescription></DialogHeader>
      <AdminCandidateSelect scope="group" :model-value="selectedUid" :selected-name="selectedName" @select="select" @update:model-value="selectedUid = $event" />
      <DialogFooter><Button type="button" variant="outline" @click="open = false">취소</Button><Button type="button" :disabled="selectedUid < 1" @click="save">변경</Button></DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { UserCogIcon } from "lucide-vue-next"
import type { BoardWriter } from "~/types/board"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import AdminCandidateSelect from "../AdminCandidateSelect.vue"

const { groupInfo, changeGroupAdmin, loadSelectedGroupInfo } = useNuboAdminContext()
const open = ref(false)
const selectedUid = ref(groupInfo.value.config.manager.uid)
const selectedName = ref(groupInfo.value.config.manager.name)
watch(open, (isOpen) => {
  if (isOpen) {
    selectedUid.value = groupInfo.value.config.manager.uid
    selectedName.value = groupInfo.value.config.manager.name
  }
})
const select = (candidate: BoardWriter) => { selectedName.value = candidate.name }
const save = async () => {
  if (await changeGroupAdmin(groupInfo.value.config.uid, selectedUid.value)) {
    open.value = false
    await loadSelectedGroupInfo(groupInfo.value.config.id)
  }
}
</script>
