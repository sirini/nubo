import type { ChatHistory } from "~/types/chat"

export type ChatMessageSegment =
  | { type: "text"; value: string }
  | { type: "hashtag"; value: string }

const hashtagPattern = /(?<![\p{L}\p{N}_])#([\p{L}\p{N}_]+)/gu

// HTML 문자열을 직접 주입하지 않고 링크가 될 해시태그만 분리한다.
export const splitChatMessage = (message: string): ChatMessageSegment[] => {
  const segments: ChatMessageSegment[] = []
  let cursor = 0

  for (const match of message.matchAll(hashtagPattern)) {
    const index = match.index
    if (index > cursor) segments.push({ type: "text", value: message.slice(cursor, index) })
    segments.push({ type: "hashtag", value: match[1] ?? "" })
    cursor = index + match[0].length
  }

  if (cursor < message.length) segments.push({ type: "text", value: message.slice(cursor) })
  return segments.length > 0 ? segments : [{ type: "text", value: message }]
}

export const hashtagSearchPath = (hashtag: string) =>
  `/search/tag/${encodeURIComponent(hashtag)}`

export const latestOutgoingMessageUid = (history: ChatHistory[], currentUserUid: number) =>
  history.findLast((message) => message.userUid === currentUserUid)?.uid
