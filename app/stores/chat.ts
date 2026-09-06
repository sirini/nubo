import { toast } from "vue-sonner"
import type { ChatHistory, ChatItem } from "~/types/chat"

export const useChatStore = defineStore("chat", () => {
  const auth = useAuthStore()
  const isLoading = ref<boolean>(false)
  const list = ref<ChatItem[]>([])
  const history = ref<ChatHistory[]>([])
  const limit = ref<number>(20)
  const targetUserUid = ref<number>(0)
  const message = ref<string>("")
  const { loadChatList, loadChatHistory, markChatRead, sendChatMessage } = useChat()
  let conversationVisible = false
  let markedIncomingThroughUid = 0
  let historyMutationRevision = 0
  let historyRequest: Promise<void> | null = null
  let historyRequestTarget = 0

  // 채팅 목록 불러오기
  const getChatList = async () => {
    if (!auth.isLoggedIn) return
    try {
      isLoading.value = true
      const response = await loadChatList(limit.value)
      if (!response.success || !response.result) {
        toast(`❌ 채팅 목록을 가져오지 못했습니다: ${response.error}`)
        return
      }
      list.value = response.result
    } catch (e) {
      toast(`❌ 채팅 목록을 가져오지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  }

  // 상대방과의 채팅 기록 가져오기
  const getChatHistory = async (target: number, options: { silent?: boolean } = {}) => {
    if (!auth.isLoggedIn || target < 1) return
    if (targetUserUid.value !== target) {
      targetUserUid.value = target
      history.value = []
      markedIncomingThroughUid = 0
      historyMutationRevision++
    }
    if (historyRequest && historyRequestTarget === target) return historyRequest

    const requestRevision = historyMutationRevision
    if (!options.silent) isLoading.value = true

    const request = (async () => {
      try {
        const response = await loadChatHistory(target, limit.value)
        if (!response.success || !response.result) {
          if (!options.silent) {
            toast(`❌ 상대방과의 대화 내용을 가져오지 못했습니다: ${response.error}`)
          }
          return
        }
        if (targetUserUid.value !== target) return
        if (requestRevision === historyMutationRevision) history.value = response.result
        await markLatestIncomingRead(response.result, target)
      } catch (e) {
        if (!options.silent) toast(`❌ 상대방과의 대화 내용을 가져오지 못했습니다: ${e}`)
      }
    })()

    historyRequest = request
    historyRequestTarget = target
    try {
      await request
    } finally {
      if (historyRequest === request) {
        historyRequest = null
        historyRequestTarget = 0
      }
      if (!options.silent) isLoading.value = false
    }
  }

  const markLatestIncomingRead = async (messages: ChatHistory[], target: number) => {
    if (!conversationVisible || targetUserUid.value !== target) return
    const throughUid = messages.findLast((item) => item.userUid === target)?.uid ?? 0
    if (throughUid <= markedIncomingThroughUid) return

    try {
      const response = await markChatRead(target, throughUid)
      if (response.success && response.result) {
        markedIncomingThroughUid = Math.max(markedIncomingThroughUid, response.result.throughUid)
      }
    } catch {
      // 다음 폴링에서 같은 throughUid를 다시 보내므로 별도 사용자 오류는 표시하지 않는다.
    }
  }

  const setConversationVisible = (visible: boolean) => {
    conversationVisible = visible
  }

  const refreshChatHistory = async () => {
    if (targetUserUid.value < 1) return
    await getChatHistory(targetUserUid.value, { silent: true })
  }

  // 채팅 메시지 보내기
  const send = useDebounceFn(async (userUid: number) => {
    if (targetUserUid.value < 1 || !auth.isLoggedIn) return
    const outgoingMessage = message.value.trim()
    if (!outgoingMessage) return
    try {
      isLoading.value = true
      const response = await sendChatMessage(targetUserUid.value, outgoingMessage)
      if (!response || !response.success || !response.result) {
        toast(`❌ 상대방에게 메세지를 보내지 못했습니다: ${response?.error}`)
        return
      }
      historyMutationRevision++
      history.value.push({
        uid: response.result,
        userUid,
        message: outgoingMessage,
        timestamp: Date.now(),
        readAt: 0,
      })
      message.value = ""
      toast(`✅ 상대방에게 메시지를 성공적으로 전달하였습니다`)
    } catch (e) {
      toast(`❌ 상대방에게 메세지를 보내지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  })

  return {
    isLoading,
    list,
    history,
    message,
    targetUserUid,

    getChatList,
    getChatHistory,
    refreshChatHistory,
    setConversationVisible,
    send,
  }
})
