import type {
  ResetPasswordParam,
  SignupParam,
  SignupResult,
  SignupStatus,
  VerifyParam,
} from "~/types/auth"
import type { Resp } from "~/types/common"
import type {
  UpdateMyInfoParam,
  UserChangePasswordParam,
  UserInfoResult,
  UserMyResult,
  UserPermissionManageParam,
} from "~/types/user"

export const useAuth = () => {
  const config = useRuntimeConfig()

  // 사용자 정보를 기존 토큰 정보로 가져와서 반환
  const loadInitUserInfo = async () => {
    const { data } = await useFetch<Resp<UserMyResult>>("/auth/load", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
    return data.value
  }

  // 다른 사용자의 공개된 정보를 가져와서 반환
  const loadInitOtherUserInfo = async (targetUserUid: number) => {
    const { data } = await useFetch<Resp<UserInfoResult>>("/auth/user/info", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { targetUserUid },
    })
    return data.value
  }

  // 로그인 처리하기
  const doLogin = async (id: string, password: string) => {
    return await $fetch<Resp<UserMyResult>>("/auth/signin", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: { id, password },
    })
  }

  // 로그아웃 처리하기
  const doLogout = async () => {
    return await $fetch<Resp<null>>("/auth/logout", {
      baseURL: config.public.apiBase,
      method: "POST",
    })
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

    return await $fetch<Resp<null>>("/auth/update", {
      baseURL: config.public.apiBase,
      method: "PATCH",
      body: fd,
    })
  }

  // 신규 가입 시 이메일 주소가 이미 등록되어 있는지 확인
  const checkUsedEmail = async (email: string) => {
    return await $fetch<Resp<boolean>>("/auth/checkemail", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: {
        email,
      },
    })
  }

  // 신규 가입 혹은 닉네임 변경 시 이미 등록되어 있는지 확인
  const checkUsedName = async (name: string) => {
    return await $fetch<Resp<boolean>>("/auth/checkname", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: {
        name,
      },
    })
  }

  // 신규 가입 진행
  const submitJoinForm = async (param: SignupParam) => {
    return await $fetch<Resp<SignupResult>>("/auth/signup", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: param,
    })
  }

  const getSignupStatus = async () => {
    return await $fetch<Resp<SignupStatus>>("/auth/signup/status", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
  }

  // 인증 코드 전송하고 가입 절차 완료
  const verifyUser = async (param: VerifyParam) => {
    return await $fetch<Resp<boolean>>("/auth/verify", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: param,
    })
  }

  // 비밀번호 초기화 요청 보내기
  const resetUserPassword = async (param: ResetPasswordParam) => {
    return await $fetch<Resp<boolean>>("/auth/reset-password", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: param,
    })
  }

  // 사용자의 비밀번호를 새로 업데이트하기
  const updateUserPassword = async (param: UserChangePasswordParam) => {
    return await $fetch<Resp<boolean>>("/auth/user/change-password", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: param,
    })
  }

  // 사용자의 각 작업별 권한 변경하기
  const updateUserPermission = async (param: UserPermissionManageParam) => {
    return await $fetch<Resp<null>>("/auth/user/manage", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: param,
    })
  }

  // 사용자의 현재 작업별 권한 정보 가져오기
  const loadInitUserPermission = async (targetUserUid: number) => {
    const { data } = await useFetch<Resp<UserPermissionManageParam>>("/auth/user/permission", {
      baseURL: config.public.apiBase,
      method: "GET",
      query: { targetUserUid },
    })

    return data.value
  }

  return {
    loadInitUserInfo,
    loadInitOtherUserInfo,
    loadInitUserPermission,
    doLogin,
    doLogout,
    updateMyInfo,
    checkUsedEmail,
    checkUsedName,
    submitJoinForm,
    getSignupStatus,
    verifyUser,
    resetUserPassword,
    updateUserPassword,
    updateUserPermission,
  }
}
