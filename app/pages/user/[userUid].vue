<template>
  <section class="min-h-screen bg-background pb-20">
    <div class="container max-w-5xl mx-auto px-4">
      <div class="flex flex-row items-center justify-center gap-6 pb-6">
        <Avatar class="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-xl">
          <AvatarImage :src="auth.otherUser.profile" />
          <AvatarFallback>{{ auth.otherUser.name.substring(0, 2) }}</AvatarFallback>
        </Avatar>

        <div>
          <div class="flex items-center gap-2 mb-1">
            <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {{ auth.otherUser.name }}
            </h1>
            <Badge variant="secondary" v-if="auth.otherUser.admin">ADMIN</Badge>
          </div>

          <div class="flex gap-6 text-sm mt-2 mb-6">
            <span
              ><strong class="text-foreground mr-1">Lv.</strong> {{ auth.otherUser.level }}</span
            >
            <span
              ><strong class="text-foreground mr-2">가입일</strong>
              {{ date(auth.otherUser.signup) }}</span
            >
          </div>

          <div class="flex gap-2">
            <CommonVTooltip content="이 사용자에게 메시지를 보냅니다">
              <Button variant="outline" class="cursor-pointer" :disabled="disabled">
                <MessageCircleIcon class="w-4 h-4 mr-2" /> 메시지
              </Button>
            </CommonVTooltip>

            <CommonVTooltip content="이 사용자를 관리자에게 신고합니다">
              <Button
                variant="outline"
                class="text-destructive cursor-pointer"
                :disabled="disabled"
              >
                <SirenIcon class="w-4 h-4 mr-2" /> 신고하기
              </Button>
            </CommonVTooltip>
          </div>
        </div>
      </div>

      <div
        class="w-full p-4 text-gray-400 text-center text-lg md:text-xl border shadow-md rounded-2xl"
      >
        {{ auth.otherUser.signature || "서명이 없습니다" }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { MessageCircleIcon, SirenIcon } from "lucide-vue-next"

const route = useRoute()
const auth = useAuthStore()
const targetUserUid = parseInt(route.params.userUid as string)
const limit = 5
const disabled = computed(() => auth.user.uid === auth.otherUser.uid || auth.user.uid < 1)

await Promise.all([
  auth.getInitOtherUserInfo(targetUserUid),
  auth.getInitUserLatestContent(targetUserUid, limit),
])
</script>
