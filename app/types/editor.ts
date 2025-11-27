// 새글작성에 필요한 파라미터들 정의
export type WritePostParam = {
  boardUid: number
  categoryUid: number
  content: string
  files: File[]
  isNotice: boolean
  isSecret: boolean
  title: string
  tags: string[]
}

// 기존글 수정에 필요한 파라미터들 정의
export type ModifyPostParam = WritePostParam & {
  postUid: number
}

// 에디터에서 헤딩 타입 정의
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
