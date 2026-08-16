// 에러 코드 타입 정의
export type Code = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

// 서버 기본 응답 타입 정의
export type Resp<T> = {
  success: boolean
  error: string
  code: Code
  result: T
}

// 에러 코드 정의
export const CODE = {
  SUCCESS: 0,
  NOT_ADMIN: 1,
  INVALID_TOKEN: 2,
  INVALID_PARAM: 3,
  FAILED_OPERATION: 4,
  DUPLICATED_VALUE: 5,
  NO_PERMISSION: 6,
  EXCEED_SIZE: 7,
  EXPIRED: 8,
  MAIL_NOT_CONFIGURED: 9,
  RATE_LIMITED: 10,
  SIGNUP_DISABLED: 11,
  INVALID_INVITE: 12,
}

// 키 값
export const VISIT_KEY = "nubo-visit-date"
export const IS_VISITED = "nubo-is-visited-today"
export const HIT_KEY = "nubo-read-marks"
export const AUTH_KEY = "nubo-auth-token"
export const REFRESH_KEY = "nubo-refresh-token"

// 값 2개 (Pair) 타입 정의
export type Pair = {
  uid: number
  name: string
}
