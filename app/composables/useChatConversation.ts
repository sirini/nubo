import type { MaybeRefOrGetter } from "vue"

const CHAT_POLL_INTERVAL = 12_000

// 활성 대화와 브라우저 탭이 모두 보일 때만 가볍게 최신 메시지를 확인한다.
export const useChatConversation = (visible: MaybeRefOrGetter<boolean>) => {
  if (import.meta.server) return

  const chat = useChatStore()
  const documentVisibility = useDocumentVisibility()
  const isActive = computed(
    () => toValue(visible) && documentVisibility.value === "visible" && chat.targetUserUid > 0,
  )
  const { pause, resume } = useIntervalFn(
    () => chat.refreshChatHistory(),
    CHAT_POLL_INTERVAL,
    { immediate: false },
  )

  watch(
    isActive,
    (active) => {
      chat.setConversationVisible(active)
      if (active) {
        void chat.refreshChatHistory()
        resume()
      } else {
        pause()
      }
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    pause()
    chat.setConversationVisible(false)
  })
}
