import { toTypedSchema } from "@vee-validate/zod"
import { z } from "zod"

export const useBoardFormSchema = () => {
  const validationSchema = toTypedSchema(
    z.object({
      adminUid: z.coerce
        .number({ invalid_type_error: "사용자 고유번호(숫자)만 허용됩니다" })
        .int("정수만 입력 가능합니다")
        .min(1, "사용자 고유번호는 1 이상이어야 합니다. (1 = 관리자)"),
      boardUid: z.coerce
        .number({ invalid_type_error: "게시판 고유번호(숫자)만 허용됩니다" })
        .int("정수만 입력 가능합니다")
        .min(1, "게시판 고유번호는 1 이상이어야 합니다")
        .optional(),
      groupUid: z.coerce.number().min(0),
      id: z
        .string()
        .min(2, "게시판 ID는 영문 소문자 기준으로 최소 2글자 이상이어야 합니다")
        .max(30, "게시판 ID는 영문 소문자 기준으로 최대 30글자 이하여야 합니다")
        .regex(/^\w+$/, "게시판 ID는 영문 소문자, 숫자 및 언더스코어만 가능합니다"),
      name: z
        .string()
        .min(2, "게시판 이름은 2글자 이상이어야 합니다")
        .max(20, "게시판 이름은 20글자 이하여야 합니다"),
      type: z.coerce.number({ invalid_type_error: "숫자만 선택 가능합니다" }),
      rowCount: z.coerce
        .number({
          invalid_type_error: "숫자만 입력 가능합니다",
        })
        .int("정수만 입력 가능합니다")
        .min(1, "게시판 목록은 최소 1개 이상의 게시글이 보여야 합니다")
        .max(200, "게시판 목록은 최대 200개까지 출력 가능합니다"),
      width: z.coerce
        .number({
          invalid_type_error: "숫자만 입력 가능합니다",
        })
        .int("정수만 입력 가능합니다")
        .min(350, "게시판 가로폭은 350px 이상이어야 합니다")
        .max(8196, "게시판 최대폭은 8196px 이하여야 합니다"),
      info: z
        .string()
        .min(2, "게시판 설명은 2글자 이상이어야 합니다")
        .max(100, "게시판 설명은 100글자 이하여야 합니다"),
      levelList: z.coerce
        .number({ invalid_type_error: "숫자만 입력 가능합니다" })
        .int("정수만 입력 가능합니다")
        .min(0, "목록보기 레벨 제한은 0(=비회원) 이상이어야 합니다")
        .max(10, "목록보기 레벨 제한은 10 이하여야 합니다")
        .default(0),
      levelView: z.coerce
        .number({ invalid_type_error: "숫자만 입력 가능합니다" })
        .int("정수만 입력 가능합니다")
        .min(0, "글보기 레벨 제한은 0(=비회원) 이상이어야 합니다")
        .max(10, "글보기 레벨 제한은 10 이하여야 합니다")
        .default(0),
      levelWrite: z.coerce
        .number({ invalid_type_error: "숫자만 입력 가능합니다" })
        .int("정수만 입력 가능합니다")
        .min(1, "글 작성 레벨 제한은 1(=회원) 이상이어야 합니다")
        .max(10, "글 작성 레벨 제한은 10 이하여야 합니다"),
      levelComment: z.coerce
        .number({ invalid_type_error: "숫자만 입력 가능합니다" })
        .int("정수만 입력 가능합니다")
        .min(1, "댓글 작성 레벨 제한은 1(=회원) 이상이어야 합니다")
        .max(10, "댓글 작성 레벨 제한은 10 이하여야 합니다"),
      levelDownload: z.coerce
        .number({ invalid_type_error: "숫자만 입력 가능합니다" })
        .int("정수만 입력 가능합니다")
        .min(0, "다운로드 레벨 제한은 0(=비회원) 이상이어야 합니다")
        .max(10, "다운로드 레벨 제한은 10 이하여야 합니다")
        .default(0),
      pointView: z.coerce
        .number({ invalid_type_error: "숫자만 입력 가능합니다" })
        .int("정수만 입력 가능합니다")
        .min(-100000, "글보기에 필요한 포인트는 -100,000 이상이어야 합니다. ")
        .max(100000, "글보기시 획득 가능한 포인트는 100,000 이하여야 합니다")
        .default(0),
      pointWrite: z.coerce
        .number({ invalid_type_error: "숫자만 입력 가능합니다" })
        .int("정수만 입력 가능합니다")
        .min(-100000, "글작성에 필요한 포인트는 -100,000 이상이어야 합니다")
        .max(100000, "글작성시 획득 가능한 포인트는 100,000 이하여야 합니다")
        .default(0),
      pointComment: z.coerce
        .number({ invalid_type_error: "숫자만 입력 가능합니다" })
        .int("정수만 입력 가능합니다")
        .min(-100000, "댓글 작성에 필요한 포인트는 -100,000 이상이어야 합니다")
        .max(100000, "댓글 작성시 획득 가능한 포인트는 100,000 이하여야 합니다")
        .default(0),
      pointDownload: z.coerce
        .number({ invalid_type_error: "숫자만 입력 가능합니다" })
        .int("정수만 입력 가능합니다")
        .min(-100000, "다운로드에 필요한 포인트는 -100,000 이상이어야 합니다")
        .max(100000, "다운로드시 획득 가능한 포인트는 100,000 이하여야 합니다")
        .default(0),
      useCategory: z.boolean(),
      categories: z
        .string()
        .transform((val) =>
          val
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "")
            .join(","),
        )
        .optional()
        .default(""),
    }),
  )

  return {
    validationSchema,
  }
}
