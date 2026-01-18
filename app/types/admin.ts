import type { Board, BoardWriter } from "./board"
import type { Pair } from "./common"

// 관리화면 메뉴(컴포넌트명) 타입 정의
export type AdminMenu = "Dashboard" | "Board" | "User" | "Report" | "System"

// 관리화면 컴포넌트명 상수로 정의
export const ADMIN_DASHBOARD: AdminMenu = "Dashboard"
export const ADMIN_BOARD: AdminMenu = "Board"
export const ADMIN_USER: AdminMenu = "User"
export const ADMIN_REPORT: AdminMenu = "Report"
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
