import type { BoardAttachment, BoardConfig, BoardListItem } from "./board"
import type { Pair } from "./common"

// 새글작성에 필요한 파라미터들 정의
export type EditorWriteParam = {
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
export type EditorModifyParam = EditorWriteParam & {
  postUid: number
}

// 에디터에서 헤딩 타입 정의
export type EditorHeadings = 1 | 2 | 3 | 4 | 5 | 6

// 글수정 시 미리 업로드한 이미지의 미리보기 타입
export type EditorPreviewAttachedImage = {
  fileUid: number
  isPopOver: boolean
  thumbnail: string
}

// 글작성/수정에서 첨부파일들 선택 시 이미지의 미리보기 타입
export type EditorSelectedImage = {
  name: string
  url: string
}

// 첨부된 파일을 삭제 시 해당 파일에 대한 정보 보관 타입
export type EditorRemoveAttached = {
  fileUid: number
  index: number
}

// 태그 자동완성 결과 타입 정의
export type EditorTagItem = Pair & {
  count: number
}

// 에디터에서 게시판 설정 및 카테고리 불러오기 결과 타입 정의
export type EditorConfigResult = {
  config: BoardConfig
  isAdmin: boolean
  categories: Pair[]
}

// 게시글에 삽입한 이미지 목록 반환 타입 정의
export type EditorInsertImageResult = {
  images: Pair[]
  maxImageUid: number
  totalImageCount: number
}

// 게시글 수정 시 가져오는 정보들 반환 타입 정의
export type EditorLoadPostResult = {
  post: BoardListItem
  files: BoardAttachment[]
  tags: Pair[]
}
