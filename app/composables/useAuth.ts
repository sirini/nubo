import type { ResetPasswordParam, SignupParam, SignupResult, VerifyParam } from "~/types/auth"
import type { Resp } from "~/types/common"
import type {
  UpdateMyInfoParam,
  UserChangePasswordParam,
  UserInfoResult,
  UserMyResult,
  UserPermissionManageParam,
} from "~/types/user"

export const useAuth = () => {
  const { reqGet, reqPost, reqPatch } = useApi()

  // 사용자 정보를 기존 토큰 정보로 가져와서 반환
  const loadInitUserInfo = async () => {
    return await reqGet<Resp<UserMyResult>>("/auth/load", {})
  }

  // 다른 사용자의 공개된 정보를 가져와서 반환
  const loadInitOtherUserInfo = async (targetUserUid: number) => {
    return await reqGet<Resp<UserInfoResult>>("/auth/user/info", { targetUserUid })
  }

  // 로그인 처리하기
  const doLogin = async (id: string, password: string) => {
    return await reqPost<Resp<UserMyResult>>("/auth/signin", { id, password })
  }

  // 로그아웃 처리하기
  const doLogout = async () => {
    return await reqPost<Resp<null>>("/auth/logout", {})
  }

  // 액세스 토큰 업데이트
  const updateRefreshToken = async (userUid: number) => {
    return await reqPost<Resp<null>>("/auth/refresh", { userUid })
  }

  // 내 프로필 정보 업데이트
  const updateMyInfo = async (param: UpdateMyInfoParam) => {
    const fd = new FormData()
    fd.append("name", param.name)
    fd.append("signature", param.signature)
    fd.append("password", param.password)

    if (param.profile) {
      fd.append("profile", param.profile)
    }

    return await reqPatch<Resp<null>>("/auth/update", fd)
  }

  // 신규 가입 시 이메일 주소가 이미 등록되어 있는지 확인
  const checkUsedEmail = async (email: string) => {
    return await reqPost<Resp<boolean>>("/auth/checkemail", { email })
  }

  // 신규 가입 혹은 닉네임 변경 시 이미 등록되어 있는지 확인
  const checkUsedName = async (name: string) => {
    return await reqPost<Resp<boolean>>("/auth/checkname", { name })
  }

  // 신규 가입 진행
  const submitJoinForm = async (param: SignupParam) => {
    return await reqPost<Resp<SignupResult>>("/auth/signup", param)
  }

  // 인증 코드 전송하고 가입 절차 완료
  const verifyUser = async (param: VerifyParam) => {
    return await reqPost<Resp<boolean>>("/auth/verify", param)
  }

  // 비밀번호 초기화 요청 보내기
  const resetUserPassword = async (param: ResetPasswordParam) => {
    return await reqPost<Resp<boolean>>("/auth/reset-password", param)
  }

  // 사용자의 비밀번호를 새로 업데이트하기
  const updateUserPassword = async (param: UserChangePasswordParam) => {
    return await reqPost<Resp<boolean>>("/auth/user/change-password", param)
  }

  // 사용자의 각 작업별 권한 변경하기
  const updateUserPermission = async (param: UserPermissionManageParam) => {
    return await reqPost<Resp<null>>("/auth/user/manage", param)
  }

  // 사용자의 현재 작업별 권한 정보 가져오기
  const loadInitUserPermission = async (targetUserUid: number) => {
    return await reqGet<Resp<UserPermissionManageParam>>("/auth/user/permission", {
      targetUserUid,
    })
  }

  // 신고 목록 가져오기

  return {
    loadInitUserInfo,
    loadInitOtherUserInfo,
    loadInitUserPermission,
    doLogin,
    doLogout,
    updateRefreshToken,
    updateMyInfo,
    checkUsedEmail,
    checkUsedName,
    submitJoinForm,
    verifyUser,
    resetUserPassword,
    updateUserPassword,
    updateUserPermission,
  }
}
