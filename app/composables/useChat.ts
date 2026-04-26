import type { ChatHistory, ChatItem } from "~/types/chat"
import type { Resp } from "~/types/common"

export const useChat = () => {
  const config = useRuntimeConfig()
  const fetch = useRequestFetch()

  // 내 채팅 목록 불러오기
  const loadChatList = async (limit: number) => {
    return await fetch<Resp<ChatItem[]>>("/chat/list", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { limit },
    })
  }

  // 상대방과의 이전 채팅 기록 가져오기
  const loadChatHistory = async (targetUserUid: number, limit: number) => {
    return await fetch<Resp<ChatHistory[]>>("/chat/history", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: {
        targetUserUid,
        limit,
      },
    })
  }

  // 상대방에게 채팅 메시지 보내기
  const sendChatMessage = async (targetUserUid: number, message: string) => {
    return await fetch<Resp<number>>("/chat/save", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: {
        targetUserUid,
        message,
      },
    })
  }

  return {
    loadChatList,
    loadChatHistory,
    sendChatMessage,
  }
}
