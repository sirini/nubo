import { describe, expect, it } from "vitest"
import { buildCommentTree, COMMENT_RESULT } from "../../app/types/comment"
import type { CommentResult } from "../../app/types/comment"

const comment = (uid: number, replyUid: number, parentUid = 0, depth = 0, name = "작성자"): CommentResult => ({
  ...structuredClone(COMMENT_RESULT),
  uid,
  replyUid,
  parentUid,
  depth,
  writer: { uid: uid + 100, name, profile: "" },
})

describe("buildCommentTree", () => {
  it("builds a multi-level tree from parentUid", () => {
    const tree = buildCommentTree([
      comment(1, 1),
      comment(2, 1, 1, 1, "첫답글"),
      comment(3, 1, 2, 2, "깊은답글"),
      comment(4, 1, 1, 1, "둘째답글"),
    ])

    expect(tree).toHaveLength(1)
    const root = tree[0]
    expect(root.comment.uid).toBe(1)
    expect(root.children.map((child) => child.comment.uid)).toEqual([2, 4])
    expect(root.children[0].children.map((child) => child.comment.uid)).toEqual([3])
    expect(root.replyTo).toBeNull()
    expect(root.children[0].replyTo).toBe("작성자")
    expect(root.children[0].children[0].replyTo).toBe("첫답글")
  })

  it("falls back to the legacy replyUid contract when parentUid is missing", () => {
    const tree = buildCommentTree([
      comment(1, 1),
      comment(2, 1),
      comment(3, 3),
    ])

    expect(tree).toHaveLength(2)
    expect(tree[0].children.map((child) => child.comment.uid)).toEqual([2])
    expect(tree[1].children).toHaveLength(0)
  })

  it("promotes orphans whose parent is outside the page to top level", () => {
    const tree = buildCommentTree([
      comment(5, 1, 2, 2),
      comment(6, 1, 5, 3),
    ])

    expect(tree.map((node) => node.comment.uid)).toEqual([5])
    expect(tree[0].replyTo).toBeNull()
    expect(tree[0].children.map((child) => child.comment.uid)).toEqual([6])
    expect(tree[0].children[0].replyTo).toBe("작성자")
  })

  it("keeps input order for roots and siblings", () => {
    const tree = buildCommentTree([
      comment(2, 2),
      comment(1, 1),
      comment(4, 1, 1, 1),
      comment(3, 1, 1, 1),
    ])

    expect(tree.map((node) => node.comment.uid)).toEqual([2, 1])
    expect(tree[1].children.map((child) => child.comment.uid)).toEqual([4, 3])
  })

  it("never creates a cycle even if a comment points to itself", () => {
    const tree = buildCommentTree([comment(1, 1, 1, 1)])
    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(0)
  })
})
