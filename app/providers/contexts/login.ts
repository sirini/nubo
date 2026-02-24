// [로그인] 화면에서 필요한 변수 & 함수들 정의
export interface NuboLoginContext {
  joinEmail: ComputedRef<string>
  joinName: ComputedRef<string>
  joinPassword: WritableComputedRef<string>
  joinPassword2: WritableComputedRef<string>
  verifyCode: WritableComputedRef<string>
  verifyTarget: WritableComputedRef<number>
  isLoading: WritableComputedRef<boolean>
  isValidEmail: ComputedRef<boolean>
  isValidName: ComputedRef<boolean>
  isValidPassword: ComputedRef<boolean>
  isValidCode: ComputedRef<boolean>
  isRequestedReset: ComputedRef<boolean>
  oauthGoogleUrl: string
  oauthNaverUrl: string
  oauthKakaoUrl: string
  resetCode: WritableComputedRef<string>
  resetTarget: WritableComputedRef<number>
  resetPassword: WritableComputedRef<string>
  resetPassword2: WritableComputedRef<string>
  login: (e?: Event | undefined) => Promise<void | undefined>
  isUsedEmail: () => Promise<void>
  isUsedName: () => Promise<void>
  submit: () => Promise<void>
  clearJoinForm: () => void
  verify: () => Promise<void>
  requestResetPassword: () => Promise<void>
  updateUserPassword: () => Promise<void>
}

export const nuboLoginKey: InjectionKey<NuboLoginContext> = Symbol("nuboLoginContext")

// [로그인] 화면에 필요한 변수 & 함수들 가져오기
export const useNuboLoginContext = () => {
  const context = inject(nuboLoginKey)
  if (!context) {
    throw new Error("useNuboLoginContext must be used within a proper provider")
  }
  return context
}
