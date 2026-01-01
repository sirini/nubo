import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import * as z from "zod"
import type { NuboLoginContext } from "~/types/nubo-skin-keys"

export const useLoginProvider = (): NuboLoginContext => {
  const config = useRuntimeConfig()
  const route = useRoute()
  const auth = useAuthStore()
  const join = useJoinStore()

  const loginSchema = toTypedSchema(
    z.object({
      email: z
        .string()
        .min(5, "이메일 주소는 5글자 이상이어야 합니다.")
        .email("유효한 이메일 주소가 아닙니다."),
      password: z.string().min(8, "비밀번호는 8글자 이상이어야 합니다."),
    }),
  )

  const { handleSubmit } = useForm({
    validationSchema: loginSchema,
    initialValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = handleSubmit(({ email, password }) => {
    const redirect = (route.query.redirect as string) || "/"
    auth.login(email, password, redirect)
  })

  return {
    joinEmail: computed({ get: () => join.email, set: (val: string) => (join.email = val) }),
    joinName: computed({ get: () => join.name, set: (val: string) => (join.name = val) }),
    joinPassword: computed({
      get: () => join.password,
      set: (val: string) => (join.password = val),
    }),
    joinPassword2: computed({
      get: () => join.password2,
      set: (val: string) => (join.password2 = val),
    }),
    verifyCode: computed({ get: () => join.code, set: (val: string) => (join.code = val) }),
    verifyTarget: computed({ get: () => join.target, set: (val: number) => (join.target = val) }),
    isLoading: computed({
      get: () => join.isLoading,
      set: (val: boolean) => (join.isLoading = val),
    }),
    isValidEmail: computed(() => join.isValidEmail),
    isValidName: computed(() => join.isValidName),
    isValidPassword: computed(() => join.isValidPassword),
    isValidCode: computed(() => join.isValidCode),
    oauthGoogleUrl: `${config.public.goapi}/auth/google/request`,
    oauthNaverUrl: `${config.public.goapi}/auth/naver/request`,
    oauthKakaoUrl: `${config.public.goapi}/auth/kakao/request`,
    login: onSubmit,
    isUsedEmail: async () => {
      await join.isUsedEmail()
    },
    isUsedName: async () => {
      await join.isUsedName()
    },
    submit: async () => {
      await join.submit()
    },
    resetJoinForm: () => join.reset(),
    verify: async () => {
      await join.verify()
    },
  }
}
