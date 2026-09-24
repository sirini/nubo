import { mountSuspended } from "@nuxt/test-utils/runtime"
import { describe, expect, it } from "vitest"
import { nextTick } from "vue"
import CommentNode from "../../app/components/comment/CommentNode.vue"
import { buildCommentTree, COMMENT_RESULT } from "../../app/types/comment"
import type { CommentResult } from "../../app/types/comment"
import { nuboViewKey } from "../../app/providers/contexts/view"
import type { NuboViewContext } from "../../app/providers/contexts/view"
import type { BoardConfig, BoardViewResult } from "../../app/types/board"

const comment = (uid: number, replyUid: number, parentUid = 0, depth = 0, name = "작성자"): CommentResult => ({
  ...structuredClone(COMMENT_RESULT),
  uid,
  replyUid,
  parentUid,
  depth,
  content: `댓글 ${uid}`,
  writer: { uid: uid + 100, name, profile: "" },
})

const noop = () => {}
const noopAsync = async () => {}
const noopAsyncBool = async () => true
const context = {
  view: computed(() => ({}) as unknown as BoardViewResult),
  config: computed(() => ({}) as unknown as BoardConfig),
  comments: computed(() => [] as CommentResult[]),
  isAdmin: computed(() => false),
  isConfirmRemoveCommentDialog: computed({ get: () => false, set: noop }),
  isConfirmRemovePostDialog: computed({ get: () => false, set: noop }),
  isMovePostDialog: computed({ get: () => false, set: noop }),
  isLoadingMoveTargets: computed(() => false),
  isMovingPost: computed(() => false),
  moveTargets: computed(() => []),
  moveTargetUid: computed({ get: () => 0, set: noop }),
  isLoggedIn: computed(() => true),
  isWriter: computed(() => false),
  imgIdx: computed({ get: () => 0, set: noop }),
  content: computed(() => ""),
  commentTarget: computed(() => ({ reply: 0, remove: 0, modify: 0 })),
  checkPermissionComment: () => false,
  setCommentReaction: noopAsync,
  confirmRemoveComment: noop,
  confirmRemovePost: noop,
  openMovePostDialog: noopAsync,
  removeComment: noopAsyncBool,
  setModifyComment: noop,
  setReplyComment: noop,
  cancelCommentTarget: noop,
  writeNewComment: noopAsyncBool,
  writeReplyComment: noopAsyncBool,
  modifyExistComment: noopAsyncBool,
  downloadFile: noopAsync,
  originalImageUrl: async () => "",
  setPostReaction: noopAsync,
  makeTableOfContents: () => [],
  updateReadingProgress: () => {},
  clearReadingProgress: () => {},
  remove: noop,
  move: noopAsync,
} satisfies NuboViewContext

describe("comment node", () => {
  it("renders nested children recursively with the replyTo badge", async () => {
    const tree = buildCommentTree([
      comment(1, 1),
      comment(2, 1, 1, 1, "첫답글"),
      comment(3, 1, 2, 2, "깊은답글"),
    ])
    const wrapper = await mountSuspended(CommentNode, {
      props: { node: tree[0]!, depth: 0 },
      global: { provide: { [nuboViewKey as symbol]: context } },
      attachTo: document.body,
    })
    await nextTick()

    expect(wrapper.text()).toContain("댓글 1")
    expect(wrapper.text()).toContain("댓글 2")
    expect(wrapper.text()).toContain("댓글 3")
    expect(wrapper.text()).toContain("첫답글님께 답글")
    // 부모 아바타에서 자식 아바타로 이어지는 연결선 요소가 재귀 구조를 만든다.
    expect(wrapper.find(".connector-elbow").exists()).toBe(true)
    expect(wrapper.find(".avatar-spine").exists()).toBe(true)
    expect(wrapper.findComponent(CommentNode).exists()).toBe(true)
    wrapper.unmount()
  })

  it("collapses and expands replies", async () => {
    const tree = buildCommentTree([
      comment(1, 1),
      comment(2, 1, 1, 1, "답글"),
    ])
    const wrapper = await mountSuspended(CommentNode, {
      props: { node: tree[0]!, depth: 0 },
      global: { provide: { [nuboViewKey as symbol]: context } },
      attachTo: document.body,
    })
    await nextTick()
    expect(wrapper.text()).toContain("댓글 2")

    const toggle = wrapper.findAll("button").find((button) => button.text().includes("답글 접기"))
    expect(toggle).toBeTruthy()
    await toggle!.trigger("click")
    await nextTick()
    expect(wrapper.text()).not.toContain("댓글 2")
    expect(wrapper.text()).toContain("답글 1개 펼치기")
    wrapper.unmount()
  })
})
