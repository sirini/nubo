<template>
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
</template>

<script setup lang="ts">
import { InfoIcon, Settings2Icon } from "lucide-vue-next"
import { BOARD_PREFIX } from "~/types/board"
import { useNuboAdminContext } from "~/types/nubo-skin-keys"

const config = useRuntimeConfig()
const { groupInfo } = useNuboAdminContext()
</script>
