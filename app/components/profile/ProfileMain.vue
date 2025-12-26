<template>
  <Card
    class="md:col-span-2 md:row-span-2 flex flex-col justify-center items-center p-8 bg-linear-to-br from-background to-muted"
  >
    <Avatar class="w-32 h-32 border-4 border-primary/20 shadow-xl mb-6">
      <AvatarImage :src="auth.otherUser.profile" />
      <AvatarFallback>{{ auth.otherUser.name.substring(0, 2) }}</AvatarFallback>
    </Avatar>
    <div class="text-center">
      <div class="flex items-center justify-center gap-4 mb-2">
        <h2 class="text-3xl font-bold tracking-tight">{{ auth.otherUser.name }}</h2>
        <CommonVTooltip content="사이트의 관리자입니다" v-if="auth.otherUser.admin">
          <Badge
            variant="outline"
            class="text-foreground inline-flex items-center gap-2 border-foreground/30"
            ><ShieldCheckIcon class="w-4 h-4" /> ADMIN
          </Badge>
        </CommonVTooltip>
      </div>
      <div class="text-muted-foreground max-w-sm">
        {{ recoverChars(auth.otherUser.signature) }}
      </div>
    </div>

    <div class="mt-8 flex gap-2" v-if="isMe">
      <CommonVTooltip content="내 프로필 이미지, 닉네임, 서명을 수정합니다">
        <LazyProfileEditSheet>
          <Button variant="outline" class="flex items-center gap-2 cursor-pointer">
            <UserRoundPenIcon class="w-4 h-4" />
            프로필 수정
          </Button>
        </LazyProfileEditSheet>
      </CommonVTooltip>

      <CommonVTooltip content="사이트에서 로그아웃 합니다">
        <Button variant="outline" class="cursor-pointer" as-child>
          <NuxtLink to="/auth/logout" class="inline-flex gap-2 items-center"
            ><LogOutIcon class="w-4 h-4" /> 로그아웃</NuxtLink
          >
        </Button></CommonVTooltip
      >
    </div>

    <div class="mt-8 flex gap-2" v-else>
      <CommonVTooltip content="이 사용자를 관리자에게 신고합니다">
        <Button
          variant="destructive"
          class="flex items-center gap-2 cursor-pointer"
          @click="report.open(auth.otherUser.uid)"
          :disabled="auth.otherUser.admin || !auth.isLoggedIn"
        >
          <SirenIcon class="w-4 h-4" />신고하기
        </Button>
      </CommonVTooltip>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { LogOutIcon, ShieldCheckIcon, SirenIcon, UserRoundPenIcon } from "lucide-vue-next"

const auth = useAuthStore()
const report = useReportStore()
const props = defineProps<{ targetUserUid: number }>()
const isMe = computed(() => props.targetUserUid === auth.user.uid)
</script>
