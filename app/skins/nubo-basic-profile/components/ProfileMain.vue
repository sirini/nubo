<template>
  <Card
    class="md:col-span-2 md:row-span-2 flex flex-col justify-center items-center p-8 bg-linear-to-br from-background to-muted"
  >
    <Avatar class="w-32 h-32 border-4 border-primary/20 shadow-xl mb-6">
      <AvatarImage :src="profileUser.profile" />
      <AvatarFallback>{{ profileUser.name.substring(0, 2) }}</AvatarFallback>
    </Avatar>
    <div class="text-center">
      <div class="flex items-center justify-center gap-4 mb-2">
        <h2 class="text-3xl font-bold tracking-tight" v-html="sanitize(profileUser.name)"></h2>
        <CommonVTooltip v-if="profileUser.admin" content="사이트의 관리자입니다">
          <Badge
            variant="outline"
            class="text-foreground inline-flex items-center gap-2 border-foreground/30"
            ><ShieldCheckIcon class="w-4 h-4" /> ADMIN
          </Badge>
        </CommonVTooltip>
      </div>
      <div class="text-muted-foreground max-w-sm" v-html="sanitize(profileUser.signature)"></div>
    </div>

    <div v-if="isMe" class="mt-8 flex gap-2">
      <CommonVTooltip content="내 프로필 이미지, 닉네임, 서명을 수정합니다">
        <ProfileEditSheet>
          <Button variant="outline" class="flex items-center gap-2 cursor-pointer">
            <UserRoundPenIcon class="w-4 h-4" />
            프로필 수정
          </Button>
        </ProfileEditSheet>
      </CommonVTooltip>

      <CommonVTooltip content="사이트에서 로그아웃 합니다">
        <Button variant="outline" class="cursor-pointer" as-child>
          <NuxtLink to="/auth/logout" class="inline-flex gap-2 items-center"
            ><LogOutIcon class="w-4 h-4" /> 로그아웃</NuxtLink
          >
        </Button></CommonVTooltip
      >
    </div>

    <div v-else class="mt-8 flex gap-2">
      <CommonVTooltip content="이 사용자를 관리자에게 신고합니다">
        <Button
          variant="destructive"
          class="flex items-center gap-2 cursor-pointer"
          :disabled="profileUser.admin"
          @click="openReportForm(profileUser.uid)"
        >
          <SirenIcon class="w-4 h-4" />신고하기
        </Button>
      </CommonVTooltip>
      <CommonVTooltip content="이 사용자의 콘텐츠와 대화를 숨깁니다">
        <Button
          variant="outline"
          class="flex items-center gap-2 cursor-pointer"
          :disabled="profileUser.admin"
          @click="isOpenBlockDialog = true"
        >
          <UserRoundCheckIcon v-if="isBlockedByMe" class="w-4 h-4" />
          <BanIcon v-else class="w-4 h-4" />
          {{ isBlockedByMe ? "차단 해제" : "사용자 차단" }}
        </Button>
      </CommonVTooltip>
    </div>
  </Card>

  <AlertDialog v-model:open="isOpenBlockDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ isBlockedByMe ? "차단을 해제할까요?" : "사용자를 차단할까요?" }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{
            isBlockedByMe
              ? "이 사용자의 콘텐츠와 대화를 다시 볼 수 있습니다."
              : "이 사용자의 콘텐츠와 기존 대화가 더 이상 표시되지 않고 새 메시지도 주고받을 수 없습니다."
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>취소</AlertDialogCancel>
        <AlertDialogAction @click="confirmBlockChange">
          {{ isBlockedByMe ? "차단 해제" : "차단" }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import {
  BanIcon,
  LogOutIcon,
  ShieldCheckIcon,
  SirenIcon,
  UserRoundCheckIcon,
  UserRoundPenIcon,
} from "lucide-vue-next"
import { useNuboProfileContext } from "~/providers/contexts/profile"
import ProfileEditSheet from "./ProfileEditSheet.vue"

const { isMe, profileUser, isBlockedByMe, openReportForm, changeUserBlock } =
  useNuboProfileContext()
const isOpenBlockDialog = ref(false)

const confirmBlockChange = async () => {
  await changeUserBlock()
  isOpenBlockDialog.value = false
}
const { sanitize } = useSanitize()
</script>
