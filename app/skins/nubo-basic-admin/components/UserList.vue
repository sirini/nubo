<template>
  <div class="space-y-3 p-4 md:hidden">
    <Card v-for="user in userList.item" :key="user.uid" class="p-4">
      <div class="flex items-start justify-between gap-3"><div><p class="font-semibold">{{ recoverChars(user.name) }}</p><p class="text-sm text-muted-foreground">{{ user.id }}</p></div><Button size="sm" variant="outline" @click="changePanel('edit', user.uid)">설정</Button></div>
      <div class="mt-4 flex gap-4 text-xs text-muted-foreground"><span>Lv. {{ user.level }}</span><span>{{ num(user.point) }} P</span><span>{{ date(user.signup) }}</span></div>
    </Card>
  </div>
  <Table class="hidden md:table">
    <TableHeader>
      <TableRow>
        <TableHead class="text-center">이름 <span class="text-muted">(ID)</span> </TableHead>
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
          <Avatar class="ml-2">
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
