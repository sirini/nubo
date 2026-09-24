import { STATUS } from "./board"
import type { Reaction, ReactionCounts } from "~/types/reaction"
import type { UserBasicInfo } from "./user"

// 댓글 목록 가져오기용 파라미터 정의
export type CommentListParam = {
  boardUid: number
  postUid: number
  userUid: number
  page: number
  limit: number
}

// 새 댓글 저장하기에 필요한 파라미터 타입 정의
export type CommentWriteParam = {
  boardUid: number
  postUid: number
  content: string
  userUid: number
}

// 댓글 수정하기에 필요한 파라미터 정의
export type CommentModifyParam = CommentWriteParam & {
  modifyTargetUid: number
}

// 댓글 삭제하기에 필요한 파라미터 정의
export type CommentRemoveParam = {
  boardUid: number
  userUid: number
  removeTargetUid: number
}

// 댓글에 답글 작성하기 시 필요한 파라미터 정의
export type CommentReplyParam = CommentWriteParam & {
  replyTargetUid: number
}

// 댓글에 좋아요 남기기 시 필요한 파라미터 정의
export type CommentReactionParam = {
  boardUid: number
  commentUid: number
  reaction: Reaction | null
}

export type CommentLikeParam = {
  boardUid: number
  commentUid: number
  userUid: number
  liked: boolean
}

// 댓글(답글) 작성 후 화면에 반영할 때 필요한 타입 정의
// 계약: reactions는 종류별 집계, myReaction은 현재 사용자의 종류(비로그인이면 null)다.
export type CommentResult = {
  uid: number
  writer: UserBasicInfo
  content: string
  like: number
  liked: boolean
  reactions: ReactionCounts
  myReaction: Reaction | null
  submitted: number
  modified: number
  status: number
  replyUid: number
  parentUid: number
  depth: number
  postUid: number
}

// 댓글(답글) 작성 후 화면에 반영할 때 필요한 기본값 정의
export const COMMENT_RESULT: CommentResult = {
  uid: 0,
  writer: { uid: 0, name: "", profile: "" },
  content: "",
  like: 0,
  liked: false,
  reactions: { like: 0, best: 0, facepalm: 0, hmm: 0, laugh: 0, celebrate: 0, fire: 0, support: 0, sad: 0, eyes: 0 },
  myReaction: null,
  submitted: Date.now(),
  modified: 0,
  status: STATUS.NORMAL,
  replyUid: 0,
  parentUid: 0,
  depth: 0,
  postUid: 0,
}

// 댓글 목록 가져오기 결과 정의
export type CommentListResult = {
  boardUid: number
  sinceUid: number
  totalCommentCount: number
  comments: CommentResult[]
}

// 다층 댓글 트리의 한 노드다. replyTo는 직계 부모 작성자 이름(루트는 null)이다.
export type CommentNode = {
  comment: CommentResult
  children: CommentNode[]
  replyTo: string | null
}

// 평면 댓글 목록을 parentUid 기반 트리로 만든다.
// parentUid가 없는 구 GOAPI 응답은 기존 계약(replyUid가 스레드 루트)으로 폴백해 2단계를 유지한다.
// 부모가 목록에 없는 고아(이전 페이지 등)는 최상위로 승격시킨다.
export const buildCommentTree = (comments: CommentResult[]): CommentNode[] => {
  const nodes = new Map<number, CommentNode>()
  for (const comment of comments) {
    nodes.set(comment.uid, { comment, children: [], replyTo: null })
  }
  const parentUidOf = (comment: CommentResult): number => {
    if (comment.parentUid) return comment.parentUid
    return comment.replyUid !== comment.uid ? comment.replyUid : 0
  }
  const roots: CommentNode[] = []
  for (const node of nodes.values()) {
    const parentUid = parentUidOf(node.comment)
    const parent = parentUid ? nodes.get(parentUid) : undefined
    if (parent && parent !== node) {
      parent.children.push(node)
      node.replyTo = parent.comment.writer.name
    } else {
      roots.push(node)
    }
  }
  return roots
}
