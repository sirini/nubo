<template>
  <div class="flex w-full bg-background">
    <aside class="w-64 bg-muted/20 flex flex-col">
      <div class="p-4 border-b flex items-center justify-between">
        <h3 class="font-semibold flex items-center gap-2">
          <LayoutPanelLeftIcon class="w-4 h-4" /> 그룹 관리
        </h3>
        <CommonVTooltip content="새로운 그룹을 생성합니다">
          <Button variant="ghost" size="icon" class="w-8 h-8 cursor-pointer">
            <PlusIcon class="w-4 h-4" />
          </Button>
        </CommonVTooltip>
      </div>

      <ScrollArea class="flex-1 p-4">
        <div class="space-y-2">
          <button
            v-for="group in groups"
            :key="group.uid"
            @click="selectedGroupId = group.id"
            class="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors cursor-pointer"
            :class="
              selectedGroupId === group.id
                ? 'bg-muted text-foreground font-medium'
                : 'hover:bg-muted'
            "
          >
            <span class="truncate">{{ group.id }}</span>
            <span class="text-xs opacity-60">{{ group.count }}</span>
          </button>
        </div>
      </ScrollArea>
    </aside>

    <main class="flex-1 flex flex-col min-w-0">
      <header class="p-4 border-b flex items-center justify-between bg-card">
        <div>
          <h2 class="text-xl font-bold">{{ groupInfo.config.id }}</h2>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" class="gap-2">
            <Settings2Icon class="w-4 h-4" /> 그룹 일괄 설정
          </Button>
          <Button size="sm" class="gap-2 text-foreground">
            <PlusIcon class="w-4 h-4" /> 새 게시판 추가
          </Button>
        </div>
      </header>

      <div class="flex-1 p-4 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="text-center">이름</TableHead>
              <TableHead class="text-center">타입</TableHead>
              <TableHead class="text-center">스킨</TableHead>
              <TableHead class="text-center">게시글 수</TableHead>
              <TableHead class="text-center">댓글 수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="board in groupInfo.boards" :key="board.uid">
              <TableCell class="font-medium cursor-pointer hover:underline text-center">
                {{ board.name }}
              </TableCell>
              <TableCell class="text-center">{{ BOARD_PREFIX[board.type] }}</TableCell>
              <TableCell class="text-center">
                <Badge variant="secondary">nubo-basic-board</Badge>
              </TableCell>
              <TableCell class="text-center">{{ num(board.total.post) }}</TableCell>
              <TableCell class="text-center">{{ num(board.total.comment) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { LayoutPanelLeftIcon, PlusIcon, Settings2Icon } from "lucide-vue-next"
import { BOARD, BOARD_PREFIX } from "~/types/board"
import { useNuboAdminContext } from "~/types/nubo-skin-keys"

const selectedGroupId = ref<string>("")
const { groups, groupInfo, loadInitGroupList, loadSelectedGroupInfo } = useNuboAdminContext()

// 선택된 그룹의 게시판 목록 (임시)
const boards = ref([
  {
    uid: 101,
    name: "자유게시판",
    type: BOARD.DEFAULT,
    skin: "nubo-basic-board",
    postCount: 1240,
  },
  {
    uid: 102,
    name: "공지사항",
    type: BOARD.DEFAULT,
    skin: "nubo-basic-board",
    postCount: 45,
  },
])

onMounted(async () => {
  await loadInitGroupList()
  const defaultGroup = groups.value.at(0)
  if (defaultGroup) {
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
