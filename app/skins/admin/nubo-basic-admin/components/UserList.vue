<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="flex items-center gap-2 justify-center cursor-help">이름 (ID) </TableHead>
        <TableHead class="text-center">레벨</TableHead>
        <TableHead class="text-center">포인트</TableHead>
        <TableHead class="text-center">가입일</TableHead>
        <TableHead class="text-center">작업</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="user in userList.item" :key="user.uid">
        <TableCell
          class="flex items-center gap-2 cursor-pointer"
          @click="changePanel('edit', user.uid)"
        >
          <Avatar>
            <AvatarImage :src="user.profile" alt="profile image" />
            <AvatarFallback class="text-xs">{{ user.name.substring(0, 2) }}</AvatarFallback>
          </Avatar>
          {{ recoverChars(user.name) }}
          <Badge variant="outline" class="text-muted">{{ user.id }}</Badge>
        </TableCell>
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
          <Badge variant="outline" class="text-muted-foreground">
            {{ dateFull(user.signup) }}
          </Badge>
        </TableCell>
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
import { Settings2Icon, Trash2Icon } from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import UserListFooter from "./UserListFooter.vue"

const { userList, openUserRemoveConfirmDialog } = useNuboAdminContext()

defineProps<{ changePanel: Function }>()
</script>
