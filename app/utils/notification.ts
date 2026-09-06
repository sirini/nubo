import {
  NOTI_CHAT_MESSAGE,
  NOTI_LEAVE_COMMENT,
  NOTI_LIKE_COMMENT,
  NOTI_LIKE_POST,
  NOTI_REPLY_COMMENT,
  type NotificationItem,
  type Noti,
} from "~/types/home"

export type NotificationPresentation = {
  action: string
  callToAction: string
}

export const getNotificationPresentation = (type: Noti): NotificationPresentation => {
  switch (type) {
    case NOTI_LIKE_POST:
      return { action: "내 게시글을 좋아합니다", callToAction: "게시글 보기" }
    case NOTI_LIKE_COMMENT:
      return { action: "내 댓글을 좋아합니다", callToAction: "댓글 보기" }
    case NOTI_LEAVE_COMMENT:
      return { action: "내 게시글에 댓글을 남겼습니다", callToAction: "댓글 보기" }
    case NOTI_REPLY_COMMENT:
      return { action: "내 댓글에 답글을 남겼습니다", callToAction: "답글 보기" }
    case NOTI_CHAT_MESSAGE:
      return { action: "나에게 1:1 메시지를 보냈습니다", callToAction: "대화 열기 및 답장" }
    default:
      return { action: "새로운 활동을 남겼습니다", callToAction: "알림 확인" }
  }
}

export const getNotificationTarget = (notification: NotificationItem): string | null => {
  if (notification.type === NOTI_CHAT_MESSAGE && notification.fromUser.uid > 0) {
    return `/user/${notification.fromUser.uid}?tab=conversation#conversation`
  }

  if (notification.id && notification.postUid > 0) {
    const postPath = `/board/${encodeURIComponent(notification.id)}/${notification.postUid}`
    return notification.type === NOTI_LIKE_POST ? postPath : `${postPath}#comments`
  }

  return null
}
