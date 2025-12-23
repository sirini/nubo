import type { ChatHistory, ChatItem } from "~/types/chat"
import type { Resp } from "~/types/common"

export const useChat = () => {
  const config = useRuntimeConfig()
  // 내 채팅 목록 불러오기
  const loadChatList = async (limit: number) => {
    return await reqGet<Resp<ChatItem[]>>("/chat/list", { limit })
  }

  // 상대방과의 이전 채팅 기록 가져오기
  const loadChatHistory = async (targetUserUid: number, limit: number) => {
    return await reqGet<Resp<ChatHistory[]>>("/chat/history", {
      targetUserUid,
      limit,
    })
  }

  // 상대방에게 채팅 메시지 보내기
  const sendChatMessage = async (targetUserUid: number, message: string) => {
    return await reqPost<Resp<number>>("/chat/save", {
      targetUserUid,
      message,
    })
  }

  return {
    loadChatList,
    loadChatHistory,
    sendChatMessage,
  }
}
