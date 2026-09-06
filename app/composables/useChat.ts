import type { ChatHistory, ChatItem, ChatReadResult } from "~/types/chat"
import type { Resp } from "~/types/common"

export const useChat = () => {
  const config = useRuntimeConfig()

  // 내 채팅 목록 불러오기
  const loadChatList = async (limit: number) => {
    return await $fetch<Resp<ChatItem[]>>("/chat/list", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { limit },
    })
  }

  // 상대방과의 이전 채팅 기록 가져오기
  const loadChatHistory = async (targetUserUid: number, limit: number) => {
    return await $fetch<Resp<ChatHistory[]>>("/chat/history", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: {
        targetUserUid,
        limit,
      },
    })
  }

  // 현재 대화 화면에서 확인한 상대방 메시지를 읽음 처리한다.
  const markChatRead = async (targetUserUid: number, throughUid: number) => {
    return await $fetch<Resp<ChatReadResult>>("/chat/read", {
      baseURL: config.public.apiBase,
      method: "PATCH",
      body: {
        targetUserUid,
        throughUid,
      },
    })
  }

  // 상대방에게 채팅 메시지 보내기
  const sendChatMessage = async (targetUserUid: number, message: string) => {
    return await $fetch<Resp<number>>("/chat/save", {
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
    markChatRead,
    sendChatMessage,
  }
}
