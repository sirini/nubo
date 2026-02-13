<template>
  <div class="flex w-full bg-background h-full">
    <aside class="hidden w-56 border-r bg-muted/20 md:flex flex-col">
      <div class="p-4 border-b flex items-center justify-between h-16">
        <h3 class="font-semibold flex items-center gap-2">
          <LayoutPanelLeftIcon class="w-4 h-4" /> 그룹 관리
        </h3>
        <CommonVTooltip content="새로운 그룹을 생성합니다">
          <Button variant="outline" size="icon" class="w-8 h-8 cursor-pointer">
            <PlusIcon class="w-4 h-4" />
          </Button>
        </CommonVTooltip>
      </div>

      <ScrollArea class="max-h-[calc(100dvh-215px)]">
        <div class="flex-1 space-y-2 p-4">
          <Button
            v-for="group in groups"
            :key="group.uid"
            @click="selectedGroupId = group.id"
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
            >
              <Trash2Icon class="w-4 h-4" />
            </Button>
          </CommonVTooltip>

          <CommonVTooltip :content="`${groupInfo.config.id}를 다른 이름으로 변경합니다`">
            <Button
              variant="outline"
              size="icon"
              class="gap-2 cursor-pointer"
              @click="openChangeGroupIdDialog(groupInfo.config.uid)"
            >
              <TextCursorInputIcon class="w-4 h-4" />
            </Button>
          </CommonVTooltip>

          <CommonVTooltip
            :content="`${groupInfo.config.id} 그룹에 속한 모든 게시판을 대상으로 동일 설정을 적용합니다`"
          >
            <Button variant="outline" size="icon" class="gap-2 cursor-pointer">
              <Settings2Icon class="w-4 h-4" />
            </Button>
          </CommonVTooltip>

          <CommonVTooltip :content="`${groupInfo.config.id} 그룹에 새 게시판을 추가합니다`">
            <Button size="icon" class="gap-2 text-foreground cursor-pointer">
              <PlusIcon class="w-4 h-4" />
            </Button>
          </CommonVTooltip>
        </div>
      </header>

      <ScrollArea class="h-[calc(100dvh-215px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="text-center">이름</TableHead>
              <TableHead class="text-center">타입</TableHead>
              <TableHead class="flex items-center gap-2 justify-center"
                >스킨
                <CommonVTooltip
                  content="다음 번 업데이트에서 스킨을 쉽게 변경하실 수 있도록 지원하겠습니다"
                >
                  <InfoIcon class="w-3 h-3" />
                </CommonVTooltip>
              </TableHead>
              <TableHead class="text-center">게시글 수</TableHead>
              <TableHead class="text-center">댓글 수</TableHead>
              <TableHead class="text-center">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="board in groupInfo.boards" :key="board.uid">
              <TableCell class="font-medium text-center"> {{ board.name }} </TableCell>
              <TableCell class="text-center">{{ BOARD_PREFIX[board.type] }}</TableCell>
              <TableCell class="text-center">
                <Badge variant="secondary">{{ config.public.skins.board }}</Badge>
              </TableCell>
              <TableCell class="text-center">{{ num(board.total.post) }}</TableCell>
              <TableCell class="text-center">{{ num(board.total.comment) }}</TableCell>
              <TableCell class="text-center">
                <CommonVTooltip content="게시판 설정을 변경하거나, 삭제할 수 있습니다">
                  <Button variant="outline" size="icon" class="w-8 h-8 cursor-pointer">
                    <Settings2Icon class="w-4 h-4" />
                  </Button>
                </CommonVTooltip>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>

      <BoardChangeGroupName />
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  ComponentIcon,
  InfoIcon,
  LayoutPanelLeftIcon,
  PlusIcon,
  Settings2Icon,
  TextCursorInputIcon,
  Trash2Icon,
} from "lucide-vue-next"
import { BOARD_PREFIX } from "~/types/board"
import { useNuboAdminContext } from "~/types/nubo-skin-keys"
import BoardChangeGroupName from "./components/dialogs/BoardChangeGroupName.vue"

const config = useRuntimeConfig()
const selectedGroupId = ref<string>("")
const { groups, groupInfo, loadInitGroupList, loadSelectedGroupInfo, openChangeGroupIdDialog } =
  useNuboAdminContext()

onMounted(async () => {
  await loadInitGroupList()
  const defaultGroup = groups.value.at(0)
  if (defaultGroup) {
    selectedGroupId.value = defaultGroup.id
    await loadSelectedGroupInfo(defaultGroup.id)
  }
})

watch(
  () => selectedGroupId.value,
  (newId) => {
    loadSelectedGroupInfo(newId)
  },
)
</script>
