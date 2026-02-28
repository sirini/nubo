<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="flex items-center gap-2 justify-center cursor-help"
          >ID
          <CommonVTooltip content="사용자의 ID는 사이트 내 어디에서도 보여지지 않습니다">
            <InfoIcon class="w-3 h-3" /> </CommonVTooltip
        ></TableHead>
        <TableHead class="text-center">이름</TableHead>
        <TableHead class="text-center">레벨</TableHead>
        <TableHead class="text-center">포인트</TableHead>
        <TableHead class="text-center">작업</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="user in userList.item" :key="user.uid">
        <TableCell class="text-center">
          <Badge variant="secondary">{{ user.id }}</Badge>
        </TableCell>
        <TableCell class="text-center">{{ recoverChars(user.name) }}</TableCell>
        <TableCell class="text-center">
          <Badge variant="outline" class="text-muted-foreground"
            >Lv. {{ user.level }}</Badge
          ></TableCell
        >
        <TableCell class="text-center">
          <Badge variant="outline" class="text-muted-foreground"
            >{{ user.point }} Pt</Badge
          ></TableCell
        >
        <TableCell class="text-center">
          <div class="flex items-center justify-center gap-2">
            <CommonVTooltip :content="`${user.name} 계정을 삭제합니다`">
              <Button
                variant="outline"
                size="icon"
                class="w-8 h-8 cursor-pointer text-red-300"
                @click="openUserRemoveConfirmDialog(user.uid, user.name)"
              >
                <Trash2Icon class="w-4 h-4" />
              </Button>
            </CommonVTooltip>

            <CommonVTooltip :content="`${user.name} 계정 정보를 수정합니다`">
              <Button
                variant="outline"
                size="icon"
                class="w-8 h-8 cursor-pointer"
                @click="changePanel('edit', user.uid)"
              >
                <Settings2Icon class="w-4 h-4" />
              </Button>
            </CommonVTooltip>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>

  <UserListFooter />
</template>

<script setup lang="ts">
import { InfoIcon, Settings2Icon, Trash2Icon } from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import UserListFooter from "./UserListFooter.vue"

const { userList, openUserRemoveConfirmDialog } = useNuboAdminContext()

defineProps<{ changePanel: Function }>()
</script>
