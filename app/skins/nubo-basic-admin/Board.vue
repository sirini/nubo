<template>
  <div class="flex w-full bg-background h-full">
    <aside class="hidden w-48 border-r bg-muted/20 md:flex flex-col">
      <div class="p-4 border-b flex items-center justify-between h-16">
        <h3 class="font-semibold flex items-center gap-2">
          <LayoutPanelLeftIcon class="w-4 h-4" /> 그룹 관리
        </h3>
        <CommonVTooltip content="새로운 그룹을 생성합니다">
          <Button
            variant="outline"
            size="icon"
            class="w-8 h-8 cursor-pointer"
            @click="openAddGroupDialog"
          >
            <PlusIcon class="w-4 h-4" />
          </Button>
        </CommonVTooltip>
      </div>

      <ScrollArea class="max-h-[calc(100dvh-215px)]">
        <div class="flex-1 space-y-2 p-4">
          <Button
            v-for="group in groups"
            :key="group.uid"
            @click="changeGroup(group.id)"
            class="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors cursor-pointer"
            :class="
              selectedGroupId === group.id
                ? 'bg-muted text-foreground font-medium'
                : 'hover:bg-muted bg-transparent text-muted-foreground opacity-70'
            "
          >
            <span class="truncate">{{ group.id }}</span>
            <span class="text-xs opacity-60">{{ group.count }}</span>
          </Button>
        </div>
      </ScrollArea>
    </aside>

    <main class="flex-1 flex flex-col min-w-0">
      <header class="p-4 border-b flex items-center justify-between bg-card h-16">
        <div class="flex items-center gap-3">
          <ComponentIcon class="w-5 h-5" />
          <h2 class="text-xl font-bold">{{ groupInfo.config.id }}</h2>
        </div>
        <div class="flex gap-2">
          <CommonVTooltip
            :content="`${groupInfo.config.id} 그룹을 삭제합니다 (기본 그룹은 삭제 불가)`"
          >
            <Button
              variant="outline"
              size="icon"
              class="gap-2 cursor-pointer text-red-300"
              :disabled="groupInfo.config.uid === 1"
              @click="openGroupRemoveConfirmDialog(groupInfo.config.uid, groupInfo.config.id)"
            >
              <Trash2Icon class="w-4 h-4" />
            </Button>
          </CommonVTooltip>

          <CommonVTooltip :content="`${groupInfo.config.id}를 다른 이름으로 변경합니다`">
            <Button
              variant="outline"
              size="icon"
              class="gap-2 cursor-pointer"
              @click="openChangeGroupIdDialog(groupInfo.config.uid, groupInfo.config.id)"
            >
              <TextCursorInputIcon class="w-4 h-4" />
            </Button>
          </CommonVTooltip>

          <CommonVTooltip
            :content="`${groupInfo.config.id} 그룹에 새 게시판을 추가합니다`"
            v-if="panel !== 'new'"
          >
            <Button size="icon" class="cursor-pointer text-foreground" @click="changePanel('new')">
              <PlusIcon class="w-4 h-4" />
            </Button>
          </CommonVTooltip>

          <CommonVTooltip
            :content="`${groupInfo.config.id} 그룹 소속 게시판 목록 보기로 돌아갑니다`"
            v-else
          >
            <Button
              variant="outline"
              size="icon"
              class="cursor-pointer text-foreground"
              @click="changePanel('list')"
            >
              <ArrowLeftIcon class="w-4 h-4" />
            </Button>
          </CommonVTooltip>
        </div>
      </header>

      <ScrollArea class="h-[calc(100dvh-215px)]">
        <BoardNew :change-panel="changePanel" v-if="panel === 'new'" />
        <BoardEdit
          :selected-board-id="selectedBoardId"
          :change-panel="changePanel"
          v-else-if="panel === 'edit'"
        />
        <BoardList :change-panel="changePanel" v-else />
      </ScrollArea>

      <BoardAddGroupDialog :change-group="changeGroup" />
      <BoardChangeGroupNameDialog />
      <BoardRemoveGroupConfirmDialog :change-panel="changePanel" />
      <BoardRemoveConfirmDialog :change-panel="changePanel" />
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  ComponentIcon,
  LayoutPanelLeftIcon,
  PlusIcon,
  TextCursorInputIcon,
  Trash2Icon,
} from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import BoardEdit from "./components/BoardEdit.vue"
import BoardList from "./components/BoardList.vue"
import BoardNew from "./components/BoardNew.vue"
import BoardAddGroupDialog from "./components/dialogs/BoardAddGroupDialog.vue"
import BoardChangeGroupNameDialog from "./components/dialogs/BoardChangeGroupNameDialog.vue"
import BoardRemoveConfirmDialog from "./components/dialogs/BoardRemoveConfirmDialog.vue"
import BoardRemoveGroupConfirmDialog from "./components/dialogs/BoardRemoveGroupConfirmDialog.vue"

type Panel = "list" | "new" | "edit"
const route = useRoute()
const selectedGroupId = ref<string>("")
const selectedBoardId = ref<string>("")
const panel = ref<Panel>("list")
const {
  groups,
  groupInfo,
  loadInitGroupList,
  loadSelectedGroupInfo,
  openChangeGroupIdDialog,
  openAddGroupDialog,
  openGroupRemoveConfirmDialog,
} = useNuboAdminContext()

// 게시판 목록 영역 내용 변경하기
const changePanel = async (p: Panel, editBoardId: string = "") => {
  panel.value = p
  selectedBoardId.value = editBoardId
  await loadInitGroupList()
  await loadSelectedGroupInfo(selectedGroupId.value)
}

// 마운트 시점에서 그룹 목록과 첫 그룹의 소속 게시판들 가져오기
onMounted(async () => {
  if (route.params?.id !== undefined) {
    changePanel("edit", route.params.id as string)
  } else {
    await loadInitGroupList()
    const defaultGroup = groups.value.at(0)
    if (defaultGroup) {
      changeGroup(defaultGroup.id)
    }
  }
})

// 그룹 변경하기
const changeGroup = async (groupId: string) => {
  selectedGroupId.value = groupId
  await loadSelectedGroupInfo(groupId)
  changePanel("list")
}
</script>
