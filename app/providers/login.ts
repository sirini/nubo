import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import * as z from "zod"
import type { NuboLoginContext } from "~/types/nubo-skin-keys"

export const useLoginProvider = (): NuboLoginContext => {
  const config = useRuntimeConfig()
  const route = useRoute()
  const auth = useAuthStore()

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
    oauthGoogleUrl: `${config.public.goapi}/auth/google/request`,
    oauthNaverUrl: `${config.public.goapi}/auth/naver/request`,
    oauthKakaoUrl: `${config.public.goapi}/auth/kakao/request`,
    login: onSubmit,
  }
}
