<template>
  <Card class="overflow-hidden border-stone-200/70 bg-linear-to-br from-amber-50/70 via-background to-orange-50/50 dark:border-stone-800 dark:from-stone-950 dark:to-amber-950/20">
    <CardContent class="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
      <Avatar class="size-24 border-4 border-background shadow-lg sm:size-28">
        <AvatarImage :src="profileUser.profile" />
        <AvatarFallback class="text-2xl">{{ profileUser.name.substring(0, 2) }}</AvatarFallback>
      </Avatar>

      <div class="min-w-0 flex-1 space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="truncate text-3xl font-semibold tracking-tight">
            {{ recoverChars(profileUser.name) }}
          </h1>
          <Badge v-if="profileUser.admin" variant="outline" class="gap-1.5">
            <ShieldCheckIcon class="size-3.5" /> 관리자
          </Badge>
        </div>
        <p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {{ recoverChars(profileUser.signature) || "아직 작성한 소개가 없습니다." }}
        </p>
        <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span class="inline-flex items-center gap-1.5"><GraduationCapIcon class="size-4" />Lv. {{ profileUser.level }}</span>
          <span class="inline-flex items-center gap-1.5"><CalendarDaysIcon class="size-4" />{{ date(profileUser.signup) }} 가입</span>
          <span v-if="isMe" class="inline-flex items-center gap-1.5"><CoinsIcon class="size-4" />{{ num(myPoint) }} 포인트</span>
        </div>
      </div>

      <div v-if="isMe" class="flex shrink-0 flex-wrap gap-2">
        <Sheet>
          <SheetTrigger as-child>
            <Button variant="outline" class="cursor-pointer gap-2">
              <UserRoundPenIcon class="size-4" />프로필 수정
            </Button>
          </SheetTrigger>
          <SheetContent side="right" class="w-full overflow-y-auto px-4 sm:max-w-sm sm:px-6">
            <SheetHeader class="text-left">
              <SheetTitle>프로필 수정</SheetTitle>
              <SheetDescription>다른 사용자에게 보여질 정보를 수정합니다.</SheetDescription>
            </SheetHeader>
            <div class="grid gap-4 py-6">
              <div class="mb-3 flex flex-col items-center gap-4">
                <Avatar class="size-28 border-2 border-primary/10">
                  <AvatarImage :src="editProfile.profile" alt="프로필 미리보기" />
                  <AvatarFallback>{{ editProfile.nickname.substring(0, 2) }}</AvatarFallback>
                </Avatar>
                <input ref="fileInputRef" type="file" class="hidden" accept="image/*" @change="changeProfileImage" />
                <Button type="button" variant="secondary" size="sm" class="cursor-pointer" @click="selectProfileImage">사진 변경</Button>
              </div>
              <Label for="advance-password1">새 비밀번호</Label>
              <Input id="advance-password1" v-model="editProfile.password1" type="password" placeholder="변경하지 않으려면 비워 두세요" />
              <Label for="advance-password2">새 비밀번호 확인</Label>
              <Input id="advance-password2" v-model="editProfile.password2" type="password" />
              <Label for="advance-nickname">닉네임</Label>
              <Input id="advance-nickname" v-model="editProfile.nickname" />
              <Label for="advance-signature">소개</Label>
              <Textarea id="advance-signature" v-model="editProfile.signature" class="h-28 resize-none" />
            </div>
            <SheetFooter>
              <Button class="w-full cursor-pointer gap-2" @click="updateMyProfile">
                <Spinner v-if="isLoading" />
                <CheckCircle2Icon v-else class="size-4" />변경사항 저장
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Button variant="outline" class="cursor-pointer gap-2" as-child>
          <NuxtLink to="/auth/logout"><LogOutIcon class="size-4" />로그아웃</NuxtLink>
        </Button>
      </div>

      <div v-else class="flex shrink-0 flex-wrap gap-2">
        <Button variant="destructive" class="cursor-pointer gap-2" :disabled="profileUser.admin" @click="openReportForm(profileUser.uid)">
          <SirenIcon class="size-4" />신고
        </Button>
        <Button variant="outline" class="cursor-pointer gap-2" :disabled="profileUser.admin" @click="isOpenBlockDialog = true">
          <UserRoundCheckIcon v-if="isBlockedByMe" class="size-4" />
          <BanIcon v-else class="size-4" />{{ isBlockedByMe ? "차단 해제" : "차단" }}
        </Button>
      </div>
    </CardContent>
  </Card>

  <AlertDialog v-model:open="isOpenBlockDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ isBlockedByMe ? "차단을 해제할까요?" : "사용자를 차단할까요?" }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ isBlockedByMe ? "이 사용자의 콘텐츠와 대화를 다시 볼 수 있습니다." : "이 사용자의 콘텐츠와 대화를 숨깁니다." }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>취소</AlertDialogCancel>
        <AlertDialogAction @click="confirmBlockChange">{{ isBlockedByMe ? "차단 해제" : "차단" }}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { BanIcon, CalendarDaysIcon, CheckCircle2Icon, CoinsIcon, GraduationCapIcon, LogOutIcon, ShieldCheckIcon, SirenIcon, UserRoundCheckIcon, UserRoundPenIcon } from "lucide-vue-next"
import { useNuboProfileContext } from "~/providers/contexts/profile"

const { changeProfileImage, changeUserBlock, editProfile, isBlockedByMe, isLoading, isMe, myPoint, openReportForm, profileUser, updateMyProfile } = useNuboProfileContext()
const fileInputRef = ref<HTMLInputElement | null>(null)
const isOpenBlockDialog = ref(false)

const selectProfileImage = () => {
  if (!fileInputRef.value) return
  fileInputRef.value.value = ""
  fileInputRef.value.click()
}

const confirmBlockChange = async () => {
  await changeUserBlock()
  isOpenBlockDialog.value = false
}
</script>
