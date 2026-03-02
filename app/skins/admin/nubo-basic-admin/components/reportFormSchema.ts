import { toTypedSchema } from "@vee-validate/zod"
import { z } from "zod"

export const useReportFormSchema = () => {
  const validationSchema = toTypedSchema(
    z.object({
      response: z.string().min(10, "조치사항은 10글자 이상 상세히 입력해주세요"),
      userUid: z.coerce
        .number({ invalid_type_error: "숫자만 허용됩니다" })
        .int("정수만 가능합니다")
        .min(2, "관리자를 제외한 사용자만 가능합니다"),

      // (신고 받은) 사용자 권한 설정값들
      writePost: z.boolean(),
      writeComment: z.boolean(),
      sendChatMessage: z.boolean(),
      sendReport: z.boolean(),
      login: z.boolean(),
    }),
  )

  return {
    validationSchema,
  }
}
