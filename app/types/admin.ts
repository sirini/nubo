import {
  BOARD_WRITER,
  type Board,
  type BoardConfig,
  type BoardWriter,
  type Search,
  type Status,
} from "./board"
import type { Pair } from "./common"
import type { UserBasicInfo } from "./user"

// 관리화면 메뉴(컴포넌트명) 타입 정의
export type AdminMenu = "Dashboard" | "Board" | "User" | "Report" | "Skin" | "System"

// 관리화면 컴포넌트명 상수로 정의
export const ADMIN_DASHBOARD: AdminMenu = "Dashboard"
export const ADMIN_BOARD: AdminMenu = "Board"
export const ADMIN_USER: AdminMenu = "User"
export const ADMIN_REPORT: AdminMenu = "Report"
export const ADMIN_SKIN: AdminMenu = "Skin"
export const ADMIN_SYSTEM: AdminMenu = "System"

// 대시보드 대표 타입 정의
export type AdminDashboard = {
  statistic: AdminDashboardStatisticResult
  latest: AdminDashboardLatest
  item: AdminDashboardItem
}

// 대시보드 최근 통계들 반환값 정의
export type AdminDashboardStatisticResult = {
  visit: AdminDashboardStatistic
  member: AdminDashboardStatistic
  post: AdminDashboardStatistic
  reply: AdminDashboardStatistic
  file: AdminDashboardStatistic
  image: AdminDashboardStatistic
}

// 대시보드 최근 통계 반환값 정의
export type AdminDashboardStatistic = {
  history: AdminDashboardStatus[]
  total: number
}

// 대시보드 일자별 데이터 반환값 정의
export type AdminDashboardStatus = {
  date: number
  visit: number
}

// 대시보드 아이템(그룹, 게시판, 회원 최신순 목록) 반환값 정의
export type AdminDashboardItem = {
  groups: Pair[]
  boards: Pair[]
  members: BoardWriter[]
}

// 대시보드 최근 (댓)글, 신고 목록 최신순 반환값 정의
export type AdminDashboardLatest = {
  posts: AdminDashboardLatestContent[]
  comments: AdminDashboardLatestContent[]
  reports: AdminDashboardLatestContent[]
}

// 대시보드 최근 신고 목록 반환값 정의
export type AdminDashboardReport = {
  uid: number
  content: string
  writer: BoardWriter
}

// 대시보드 최근 (댓)글 목록 반환값 정의
export type AdminDashboardLatestContent = AdminDashboardReport & {
  id: string
  type: Board
}

// 대시보드에서 그래프 출력용 타입 정의
export type AdminDashboardGraphData = {
  date: Date
  post: number
  comment: number
  visit: number
}

// (댓)글 검색하기에 필요한 파라미터 정의
export type AdminLatestParam = {
  page: number
  limit: number
  option: Search
  keyword: string
}

// 신고 목록 검색하기에 필요한 파라미터 정의
export type AdminReportParam = AdminLatestParam & {
  isSolved: boolean
}

// 신고 목록 반환값 정의
export type AdminReportItem = {
  uid: number
  to: BoardWriter
  from: BoardWriter
  request: string
  response: string
  date: number
}

// 최근 (댓)글 출력에 필요한 공통 반환값 정의
export type AdminLatestCommon = {
  uid: number
  id: string
  type: Board
  name: string
  like: number
  date: number
  status: Status
  writer: BoardWriter
}

// 최근 댓글 반환값 정의
export type AdminLatestComment = AdminLatestCommon & {
  content: string
  postUid: number
}

// 최근 게시글 반환값 정의
export type AdminLatestPost = AdminLatestCommon & {
  title: string
  comment: number
  hit: number
}

// 그룹 관리화면 일반 설정들 반환값 정의
export type AdminGroupConfig = {
  uid: number
  id: string
  count: number
  manager: BoardWriter
}

// 그룹 관리화면 일반 설정들 기본값
export const ADMIN_GROUP_CONFIG: AdminGroupConfig = {
  uid: 0,
  id: "",
  count: 0,
  manager: BOARD_WRITER,
}

// 그룹 설정 및 소속 게시판들 정보 반환값 정의
export type AdminGroupListResult = {
  config: AdminGroupConfig
  boards: AdminGroupBoardItem[]
}

// 그룹 관리화면 게시판 및 통계 목록 반환값 정의
export type AdminGroupBoardItem = AdminGroupConfig & {
  id: string
  type: Board
  name: string
  info: string
  total: AdminGroupBoardStatus
}

// 게시판별 간단 통계 반환값 정의
export type AdminGroupBoardStatus = {
  post: number
  comment: number
  file: number
  image: number
}

// 새 게시판 생성하기에 필요한 파라미터 정의
export type AdminBoardCreateParam = {
  adminUid: number
  categories: string
  groupUid: number
  id: string
  info: string
  levelComment: number
  levelDownload: number
  levelList: number
  levelView: number
  name: string
  pointComment: number
  pointDownload: number
  pointView: number
  pointWrite: number
  rowCount: number
  type: Board
  useCategory: boolean
  width: number
}

// 게시판 수정하기에 필요한 파라미터 정의
export type AdminBoardModifyParam = AdminBoardCreateParam & {
  boardUid: number
}

// 게시판 설정값 및 그룹 목록 반환값 정의
export type AdminBoardResult = {
  config: BoardConfig
  groups: Pair[]
}

// 사용자 목록 조회 시 필요한 파라미터 정의
export type AdminUserParam = AdminLatestParam & {
  isBlocked: boolean
}

// 사용자 목록 아이템
export type AdminUserItem = UserBasicInfo & {
  id: string
  level: number
  point: number
  signup: number
}

// 사용자 목록 결과
export type AdminUserListResult = {
  item: AdminUserItem[]
  total: number
}

// 사용자 정보 반환값 정의
export type AdminUserInfo = BoardWriter & {
  id: string
  level: number
  point: number
}
