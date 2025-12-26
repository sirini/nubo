<template>
  <Card class="flex w-full h-full overflow-hidden p-0 border-0 rounded-none relative">
    <ScrollArea ref="scrollAreaRef" class="flex-1 px-4 h-full">
      <div class="space-y-4">
        <div
          v-for="(history, index) in chat.history"
          :key="index"
          :class="['flex', history.userUid === auth.user.uid ? 'justify-end' : 'justify-start']"
        >
          <div
            :class="[
              'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
              history.userUid === auth.user.uid
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

        <div v-if="chat.history.length < 1" class="flex justify-center items-center text-muted">
          {{ auth.otherUser.name }}님과의 대화 기록이 없습니다
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
          v-model="chat.message"
          :placeholder="auth.isLoggedIn ? '메시지를 입력해 주세요' : '로그인이 필요합니다'"
          @keyup.enter="chat.send"
          class="flex-1"
        />
      </CommonVTooltip>

      <CommonVTooltip content="상대방에게 메시지를 남깁니다">
        <Button
          @click="chat.send"
          class="text-foreground flex items-center gap-2 cursor-pointer"
          :disabled="!auth.isLoggedIn"
        >
          <Spinner v-if="chat.isLoading" />
          <SendIcon class="w-4 h-4" v-else />
          전송</Button
        >
      </CommonVTooltip>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { SendIcon } from "lucide-vue-next"
import ScrollArea from "../ui/scroll-area/ScrollArea.vue"

const auth = useAuthStore()
const chat = useChatStore()
const scrollAreaRef = ref<InstanceType<typeof ScrollArea> | null>(null)

// 채팅 내역 스크롤을 항상 하단으로 하는 함수
const scrollToBottom = useDebounceFn(() => {
  nextTick(() => {
    if (scrollAreaRef.value) {
      const viewport = scrollAreaRef.value.$el.querySelector("[data-reka-scroll-area-viewport]")
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth",
        })
      }
    }
  })
})

// 채팅 입력 감지 시 스크롤 아래로 옮겨주기
watch(
  () => chat.history,
  () => scrollToBottom(),
)

onMounted(() => scrollToBottom())
</script>
