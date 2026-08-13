<template>
  <div class="space-y-3 p-4 md:hidden">
    <Card v-for="board in groupInfo.boards" :key="board.uid" class="p-4">
      <div class="flex items-start justify-between gap-3"><div><NuxtLink :to="`/board/${board.id}`" class="font-semibold">{{ board.name }}</NuxtLink><p class="text-sm text-muted-foreground">{{ board.id }} · {{ showTypeName(board.type) }}</p></div><Button size="sm" variant="outline" @click="changePanel('edit', board.id)">설정</Button></div>
      <div class="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground"><span>관리자 {{ board.manager.name }}</span><span>글 {{ num(board.total.post) }}</span><span>댓글 {{ num(board.total.comment) }}</span></div>
    </Card>
  </div>
  <Table class="hidden md:table">
    <TableHeader>
      <TableRow>
        <TableHead class="text-center">이름</TableHead>
        <TableHead class="text-center">타입</TableHead>
        <TableHead class="flex items-center gap-2 justify-center cursor-help"
          >스킨
          <CommonVTooltip content="게시판 설정에서 선택한 스킨입니다">
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
        <TableCell class="text-center">
          <NuxtLink
            :to="`/board/${board.id}`"
            class="flex items-center justify-center gap-2 cursor-pointer hover:text-primary transition-colors"
          >
            <ExternalLinkIcon class="w-4 h-4" />
            <span>{{ board.name }}</span>
          </NuxtLink>
        </TableCell>
        <TableCell class="text-center">{{ showTypeName(board.type) }}</TableCell>
        <TableCell class="text-center">
          <Badge variant="secondary">{{ board.skinKey }}</Badge>
        </TableCell>
        <TableCell class="text-center">{{ num(board.total.post) }}</TableCell>
        <TableCell class="text-center">{{ num(board.total.comment) }}</TableCell>
        <TableCell class="text-center">
          <CommonVTooltip content="게시판 설정을 변경하거나, 삭제할 수 있습니다">
            <Button
              variant="outline"
              size="icon"
              class="w-8 h-8 cursor-pointer"
              @click="changePanel('edit', board.id)"
            >
              <Settings2Icon class="w-4 h-4" />
            </Button>
          </CommonVTooltip>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

<script setup lang="ts">
import { ExternalLinkIcon, InfoIcon, Settings2Icon } from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import { BOARD, type Board } from "~/types/board"

const { groupInfo } = useNuboAdminContext()

defineProps<{ changePanel: (panel: "edit", boardId: string) => void }>()

// 게시판의 형태 반환
const showTypeName = (type: Board) => {
  switch (type) {
    case BOARD.GALLERY:
      return "Gallery"
    case BOARD.BLOG:
      return "Blog"
    default:
      return "Board"
  }
}
</script>
