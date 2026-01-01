// localStorage 키 값 정의
export const USER_INFO_KEY = "nuboUserInfo"

// (로그인 한) 내 정보 타입 정의
export type UserMyResult = UserInfoResult & {
  id: string
  point: number
  token: string
  refresh: string
}

// (공개된) 사용자 정보 기본값
export const USER_INFO_RESULT: UserInfoResult = {
  uid: 0,
  name: "",
  profile: "",
  level: 0,
  signature: "",
  signup: Date.now(),
  signin: Date.now(),
  admin: false,
  blocked: false,
}

// (로그인 한) 내 정보 타입 기본값
export const MY_INFO_RESULT: UserMyResult = {
  ...USER_INFO_RESULT,
  id: "",
  point: 0,
  token: "",
  refresh: "",
}

// 사용자의 최소 기본 정보들 타입 정의
export type UserBasicInfo = {
  uid: number
  name: string
  profile: string
}

// 사용자의 최소 기본 정보 기본값 정의
export const USER_BASIC_INFO = {
  uid: 0,
  name: "",
  profile: "",
}

// 내가 신고한 사용자인지, 내 블랙리스트에 있는 사용자인지 확인한 결과들 타입 정의
export type UserCheckReportResult = {
  isReported: boolean
  isBannedByMe: boolean
}

// (공개된) 사용자 정보 타입 정의
export type UserInfoResult = {
  uid: number
  name: string
  profile: string
  level: number
  signature: string
  signup: number
  signin: number
  admin: boolean
  blocked: boolean
}

// 사용자 정보 수정에 필요한 파라미터 정의
export type UpdateMyInfoParam = {
  name: string
  signature: string
  password: string
  profile: File | null
}

// 사용자의 권한 정보들 타입 정의
export type UserPermissionResult = {
  writePost: boolean
  writeComment: boolean
  sendChatMessage: boolean
  sendReport: boolean
}

// 사용자 권한 및 로그인, 신고 내역 정의
export type UserPermissionReportResult = UserPermissionResult & {
  login: boolean
  userUid: number
  response: string
}

// 사용자 권한 및 로그인, 신고 내역 기본값
export const USER_PERMISSION_REPORT_RESULT: UserPermissionReportResult = {
  writePost: false,
  writeComment: false,
  sendChatMessage: false,
  sendReport: false,
  login: false,
  userUid: 0,
  response: "",
}

// 프로필 수정 시 필요한 입력값들 정의
export type EditProfileParam = {
  password1: string
  password2: string
  nickname: string
  profile: string
  signature: string
  newProfile: File | null
  fileInput: HTMLInputElement | null
}

// 프로필 수정 시 필요한 타입의 기본값
export const EDIT_PROFILE_PARAM: EditProfileParam = {
  password1: "",
  password2: "",
  nickname: "",
  profile: "",
  signature: "",
  newProfile: null,
  fileInput: null,
}
