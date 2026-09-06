<template>
  <Card id="conversation" class="scroll-mt-24 overflow-hidden">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-base"><MessagesSquareIcon class="size-4" />{{ recoverChars(profileUser.name) }}님과의 대화</CardTitle>
      <CardDescription>개인정보나 계좌 정보는 메시지로 전달하지 마세요.</CardDescription>
    </CardHeader>
    <CardContent>
      <ScrollArea class="h-80 rounded-lg border bg-muted/20 p-4">
        <div class="space-y-3">
          <div v-for="(history, index) in chatHistories" :key="index" :class="['flex', history.userUid === chatMyUid ? 'justify-end' : 'justify-start']">
            <div :class="['max-w-[82%] rounded-2xl px-3 py-2 text-sm', history.userUid === chatMyUid ? 'bg-primary text-primary-foreground' : 'bg-background shadow-sm']">
              {{ recoverChars(history.message) }}
              <div class="mt-1 text-right text-[10px] opacity-70">{{ dateFull(history.timestamp) }}</div>
            </div>
          </div>
          <p v-if="!chatHistories.length" class="py-24 text-center text-sm text-muted-foreground">아직 대화 기록이 없습니다.</p>
        </div>
      </ScrollArea>
      <div class="mt-3 flex gap-2">
        <Input v-model="chatMessage" :placeholder="isBlockedByMe ? '차단한 사용자와는 대화할 수 없습니다' : isLoggedIn ? '메시지를 입력해 주세요' : '로그인이 필요합니다'" :disabled="!isLoggedIn || isBlockedByMe" @keyup.enter="sendChatMessage" />
        <Button class="cursor-pointer gap-2" :disabled="!isLoggedIn || isBlockedByMe" @click="sendChatMessage">
          <Spinner v-if="isLoading" /><SendIcon v-else class="size-4" />전송
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { MessagesSquareIcon, SendIcon } from "lucide-vue-next"
import { useNuboProfileContext } from "~/providers/contexts/profile"

const { chatHistories, chatMessage, chatMyUid, isBlockedByMe, isLoading, isLoggedIn, profileUser, sendChatMessage } = useNuboProfileContext()
</script>
