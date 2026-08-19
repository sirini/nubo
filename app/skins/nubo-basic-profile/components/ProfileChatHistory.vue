<template>
  <ClientOnly>
    <Card class="flex w-full h-full overflow-hidden p-0 border-0 rounded-none relative">
      <ScrollArea class="flex-1 px-4">
        <div class="space-y-4 h-20">
          <div
            v-for="(history, index) in chatHistories"
            :key="index"
            :class="['flex', history.userUid === chatMyUid ? 'justify-end' : 'justify-start']"
          >
            <div
              :class="[
                'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                history.userUid === chatMyUid
                  ? 'bg-primary text-foreground rounded-tr-none'
                  : 'bg-muted text-foreground rounded-tl-none',
              ]"
            >
              {{ recoverChars(history.message) }}
              <div class="text-[10px] opacity-70 mt-1 text-right">
                {{ dateFull(history.timestamp) }}
              </div>
            </div>
          </div>

          <div class="h-20"></div>

          <div v-if="chatHistories.length < 1" class="flex justify-center items-center text-muted">
            {{ recoverChars(profileUser.name) }}님과의 대화 기록이 없습니다
          </div>
        </div>
      </ScrollArea>

      <div
        class="absolute bottom-0 w-full h-18 backdrop-blur-md flex gap-2 items-center p-4 border-t"
      >
        <CommonVTooltip
          content="계좌 정보나 휴대폰 번호 등 어떤 종류의 개인 정보도 상대방에게 전달하지 마세요"
        >
          <Input
            v-model="chatMessage"
            :placeholder="isLoggedIn ? '메시지를 입력해 주세요' : '로그인이 필요합니다'"
            class="flex-1"
            @keyup.enter="sendChatMessage"
          />
        </CommonVTooltip>

        <CommonVTooltip content="상대방에게 메시지를 남깁니다">
          <Button
            class="text-foreground flex items-center gap-2 cursor-pointer"
            :disabled="!isLoggedIn"
            @click="sendChatMessage"
          >
            <Spinner v-if="isLoading" />
            <SendIcon v-else class="w-4 h-4" />
            전송</Button
          >
        </CommonVTooltip>
      </div>
    </Card>
  </ClientOnly>
</template>

<script setup lang="ts">
import { SendIcon } from "lucide-vue-next"
import type { ScrollArea } from "~/components/ui/scroll-area"
import { useNuboProfileContext } from "~/providers/contexts/profile"

// 채팅 메시지 전송 시 스크롤을 하단으로 옮기기
const scrollToBottom = useDebounceFn(() => {
  nextTick(() => {
    const chatArea = document.querySelector("[data-reka-scroll-area-viewport]")
    if (chatArea) {
      chatArea.scrollTo({
        top: chatArea.scrollHeight,
        behavior: "smooth",
      })
    }
  })
})

// 대화 목록을 아래로 스크롤
onMounted(() => {
  scrollToBottom()
  watch(
    () => chatHistories.value,
    () => scrollToBottom(),
    { deep: true },
  )
})

const {
  isLoggedIn,
  isLoading,
  chatHistories,
  chatMyUid,
  chatMessage,
  profileUser,
  sendChatMessage,
} = useNuboProfileContext()
</script>
