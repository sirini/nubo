// 회원 가입 시 인증 메일 요청 발송에 필요한 파라미터 정의
export type SignupParam = {
  id: string
  password: string
  name: string
}

// 회원 가입 시 인증 메일 요청 후 받은 응답 정의
export type SignupResult = {
  target: number
}

// 비밀번호 초기화 요청 보낼 때의 파라미터 정의
export type ResetPasswordParam = {
  email: string
}

// 인증 코드를 포함해서 가입 완료 처리 시 필요한 파라미터 정의
export type VerifyParam = {
  id: string
  password: string
  name: string
  target: number
  code: string
}
