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
  const { loadChatList, loadChatHistory, sendChatMessage } = useChat()

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
  const getChatHistory = async (target: number) => {
    if (!auth.isLoggedIn) return
    try {
      isLoading.value = true
      targetUserUid.value = target
      history.value = []

      const response = await loadChatHistory(target, limit.value)
      if (!response.success || !response.result) {
        toast(`❌ 상대방과의 대화 내용을 가져오지 못했습니다: ${response.error}`)
        return
      }
      history.value = response.result
    } catch (e) {
      toast(`❌ 상대방과의 대화 내용을 가져오지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  }

  // 채팅 메시지 보내기
  const send = useDebounceFn(async (userUid: number) => {
    if (targetUserUid.value < 1 || !auth.isLoggedIn) return
    try {
      isLoading.value = true
      const response = await sendChatMessage(targetUserUid.value, message.value)
      if (!response || !response.success || !response.result) {
        toast(`❌ 상대방에게 메세지를 보내지 못했습니다: ${response?.error}`)
        return
      }
      history.value.push({
        uid: response.result,
        userUid,
        message: message.value,
        timestamp: Date.now(),
      })
      toast(`✅ 상대방에게 메시지를 성공적으로 전달하였습니다`)
    } catch (e) {
      toast(`❌ 상대방에게 메세지를 보내지 못했습니다: ${e}`)
    } finally {
      message.value = ""
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
    send,
  }
})
