<template>
  <div class="flex w-full bg-background h-full">
    <main class="flex-1 flex flex-col min-w-0">
      <header class="p-4 border-b flex items-center justify-between bg-card h-16">
        <div class="flex items-center gap-3">
          <ComponentIcon class="w-5 h-5" />
          <h2 class="text-xl font-bold">사용자 관리</h2>
        </div>
        <div class="flex gap-2">
          <CommonVTooltip v-if="panel === 'list'" content="새로운 사용자를 추가합니다">
            <Button class="cursor-pointer text-foreground" @click="changePanel('new')">
              <PlusIcon class="w-4 h-4" />
              <span>새 사용자 추가</span>
            </Button>
          </CommonVTooltip>

          <CommonVTooltip v-else content="사용자 목록 보기">
            <Button variant="outline" class="cursor-pointer" @click="changePanel('list')">
              <ListIcon class="w-4 h-4" />
              <span>목록</span>
            </Button>
          </CommonVTooltip>
        </div>
      </header>

      <div>
        <UserNew v-if="panel === 'new'" :change-panel="changePanel" />
        <UserEdit
          v-else-if="panel === 'edit'"
          :selected-user-uid="selectedUserUid"
          :change-panel="changePanel"
        />
        <UserList v-else :change-panel="changePanel" />
      </div>

      <UserRemoveConfirmDialog :change-panel="changePanel" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ComponentIcon, ListIcon, PlusIcon } from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import UserEdit from "./components/UserEdit.vue"
import UserList from "./components/UserList.vue"
import UserNew from "./components/UserNew.vue"
import UserRemoveConfirmDialog from "./components/dialogs/UserRemoveConfirmDialog.vue"

type Panel = "list" | "new" | "edit"
const selectedUserUid = ref<number>(0)
const panel = ref<Panel>("list")
const { loadInitUserList } = useNuboAdminContext()

// 마운트 시점에서 사용자 목록 가져오기
onMounted(async () => {
  await loadInitUserList()
})

// 사용자 목록 영역 내용 변경하기
const changePanel = async (p: Panel, editUserUid: number = 0) => {
  panel.value = p
  selectedUserUid.value = editUserUid
  if (p === "list") {
    await loadInitUserList()
  }
}
</script>
