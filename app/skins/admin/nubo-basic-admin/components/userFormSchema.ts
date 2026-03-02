import { toTypedSchema } from "@vee-validate/zod"
import { z } from "zod"

export const useUserFormSchema = () => {
  // 새 사용자 정보 추가시 사용할 스키마
  const newValidationSchema = toTypedSchema(
    z
      .object({
        id: z.string().email({ message: "이메일 형식이어야 합니다" }),
        name: z
          .string()
          .min(2, "닉네임은 2글자 이상이어야 합니다")
          .max(30, "닉네임은 30글자 이하여야 합니다"),
        password: z
          .string()
          .min(8, "비밀번호는 8자 이상이어야 합니다")
          .refine((val) => /[a-z]/i.test(val), "영문자가 포함되어야 합니다")
          .refine((val) => /\d/.test(val), "숫자가 포함되어야 합니다")
          .refine((val) => /[!@#$%^&*()_+]/.test(val), "특수문자가 포함되어야 합니다"),
        confirmPassword: z.string(),
        profile: z
          .instanceof(File)
          .nullable()
          .refine((file) => {
            if (!file) return true
            return file.size <= 10 * 1024 * 1024
          }, "프로필 이미지는 10MB 이하여야 합니다")
          .refine((file) => {
            if (!file) return true
            return ["image/jpeg", "image/png", "image/webp"].includes(file.type)
          }, "JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다"),
        oldProfile: z.string(),
        level: z.coerce
          .number({ invalid_type_error: "숫자만 입력 가능합니다" })
          .int("정수만 입력 가능합니다")
          .min(1, "사용자 레벨은 1 이상이어야 합니다")
          .max(10, "사용자 레벨은 10 이하여야 합니다"),
        point: z.coerce
          .number({ invalid_type_error: "숫자만 입력 가능합니다" })
          .int("정수만 입력 가능합니다")
          .min(100, "신규 사용자는 최소 100 포인트 이상 부여해야 합니다")
          .max(100_000, "신규 사용자는 최대 100,000 포인트 이하로만 부여해야 합니다"),
        signature: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "비밀번호가 일치하지 않습니다",
        path: ["confirmPassword"],
      }),
  )

  // 사용자 정보 수정 시 사용할 스키마
  const modifyValidationSchema = toTypedSchema(
    z
      .object({
        userUid: z.coerce
          .number({ invalid_type_error: "숫자만 입력 가능합니다" })
          .int("정수만 입력 가능합니다")
          .optional(),
        id: z.string().email({ message: "이메일 형식이어야 합니다" }),
        name: z
          .string()
          .min(2, "닉네임은 2글자 이상이어야 합니다")
          .max(30, "닉네임은 30글자 이하여야 합니다"),
        password: z.string().optional().or(z.literal("")),
        confirmPassword: z.string().optional().or(z.literal("")),
        profile: z
          .instanceof(File)
          .nullable()
          .refine((file) => {
            if (!file) return true
            return file.size <= 10 * 1024 * 1024
          }, "프로필 이미지는 10MB 이하여야 합니다")
          .refine((file) => {
            if (!file) return true
            return ["image/jpeg", "image/png", "image/webp"].includes(file.type)
          }, "JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다"),
        oldProfile: z.string(),
        level: z.coerce
          .number({ invalid_type_error: "숫자만 입력 가능합니다" })
          .int("정수만 입력 가능합니다")
          .min(1, "사용자 레벨은 1 이상이어야 합니다")
          .max(10, "사용자 레벨은 10 이하여야 합니다"),
        point: z.coerce
          .number({ invalid_type_error: "숫자만 입력 가능합니다" })
          .int("정수만 입력 가능합니다")
          .min(100, "신규 사용자는 최소 100 포인트 이상 부여해야 합니다")
          .max(100_000, "신규 사용자는 최대 100,000 포인트 이하로만 부여해야 합니다"),
        signature: z.string(),

        // 사용자 권한 설정값들 (별도 엔드포인트에서 처리)
        writePost: z.boolean(),
        writeComment: z.boolean(),
        sendChatMessage: z.boolean(),
        sendReport: z.boolean(),
        login: z.boolean(),
      })
      .superRefine(({ password, confirmPassword }, ctx) => {
        if (password || confirmPassword) {
          if (password && !/[a-z]/i.test(password)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "영문자가 포함되어야 합니다",
              path: ["password"],
            })
          }

          if (password && !/\d/.test(password)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "숫자가 포함되어야 합니다",
              path: ["password"],
            })
          }

          if (password && !/[!@#$%^&*()_+]/.test(password)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "특수문자가 포함되어야 합니다",
              path: ["password"],
            })
          }

          if (password !== confirmPassword) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "비밀번호가 일치하지 않습니다",
              path: ["confirmPassword"],
            })
          }
        }
      }),
  )

  return {
    newValidationSchema,
    modifyValidationSchema,
  }
}
