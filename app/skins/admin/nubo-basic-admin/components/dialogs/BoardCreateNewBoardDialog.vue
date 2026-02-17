<template>
  <Dialog v-model:open="isCreateNewBoardDialog" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>새 게시판</DialogTitle>
        <DialogDescription>새로운 게시판을 기본값으로 빠르게 추가합니다</DialogDescription>
      </DialogHeader>

      <ScrollArea class="max-h-[calc(100dvh-250px)]">
        <form id="createNewBoard" @submit="onSubmit">
          <FieldGroup class="space-y-4">
            <div class="grid sm:grid-cols-2 gap-3">
              <VeeField v-slot="{ field, errors }" name="id">
                <Field :data-invalid="!!errors.length">
                  <CommonVTooltip
                    content="영문 소문자, 숫자 및 언더 스코어 기호만 가능합니다 (예: free)"
                  >
                    <Input
                      id="boardId"
                      v-bind="field"
                      placeholder="게시판 ID"
                      autocomplete="off"
                      :aria-invalid="!!errors.length"
                    />
                  </CommonVTooltip>
                  <FieldError v-if="errors.length" :error="errors" />
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="name">
                <Field :data-invalid="!!errors.length">
                  <CommonVTooltip content="이 게시판의 이름을 지정해보세요 (예: 자유게시판)">
                    <Input
                      id="boardName"
                      v-bind="field"
                      placeholder="게시판 이름"
                      autocomplete="off"
                      :aria-invalid="!!errors.length"
                    />
                  </CommonVTooltip>
                  <FieldError v-if="errors.length" :error="errors" />
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="type">
                <Field :data-invalid="!!errors.length">
                  <Select
                    :model-value="field.value"
                    @update:model-value="field.onChange"
                    @blur="field.onBlur"
                  >
                    <CommonVTooltip
                      content="일반적인 게시판 타입부터 갤러리 혹은 블로그 형식으로 지정할 수 있습니다"
                    >
                      <SelectTrigger id="boardType" :aria-invalid="!!errors.length">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                    </CommonVTooltip>
                    <SelectContent position="item-aligned">
                      <SelectItem :value="0"> 게시판 </SelectItem>
                      <SelectItem :value="1"> 갤러리 </SelectItem>
                      <SelectItem :value="2"> 블로그 </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="rowCount">
                <Field :data-invalid="!!errors.length">
                  <CommonVTooltip content="한 페이지에 보여줄 게시글 수를 지정하세요 (예: 20)">
                    <Input
                      id="boardRowCount"
                      v-bind="field"
                      autocomplete="off"
                      placeholder="목록 수"
                      :aria-invalid="!!errors.length"
                    />
                  </CommonVTooltip>
                  <FieldError v-if="errors.length" :error="errors" />
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="width">
                <Field :data-invalid="!!errors.length">
                  <CommonVTooltip content="게시판의 최대 가로폭 너비를 지정하세요 (예: 1000)">
                    <Input
                      id="boardWidth"
                      v-bind="field"
                      autocomplete="off"
                      placeholder="게시판 너비"
                      :aria-invalid="!!errors.length"
                    />
                  </CommonVTooltip>
                  <FieldError v-if="errors.length" :error="errors" />
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="info">
                <Field :data-invalid="!!errors.length">
                  <CommonVTooltip
                    content="게시판 소개글을 입력해보세요 (예: 자유롭게 이야기를 나누는 공간)"
                  >
                    <Input
                      id="boardInfo"
                      v-bind="field"
                      placeholder="게시판 소개글"
                      autocomplete="off"
                      :aria-invalid="!!errors.length"
                    />
                  </CommonVTooltip>
                  <FieldError v-if="errors.length" :error="errors" />
                </Field>
              </VeeField>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <VeeField v-slot="{ field, errors }" name="levelList">
                <Field :data-invalid="!!errors.length">
                  <Select :model-value="field.value" @update:model-value="field.onChange">
                    <CommonVTooltip
                      content="게시판 목록을 볼 때 요구되는 레벨을 설정합니다 (0 = 비회원도 가능)"
                    >
                      <SelectTrigger id="boardLevelList" :aria-invalid="!!errors.length">
                        <SelectValue placeholder="목록보기" />
                      </SelectTrigger>
                    </CommonVTooltip>

                    <SelectContent position="item-aligned">
                      <SelectItem v-for="(_, lv) in 11" :key="lv" :value="lv"
                        >Lv. {{ lv }}</SelectItem
                      >
                    </SelectContent>
                  </Select>
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="levelView">
                <Field :data-invalid="!!errors.length">
                  <Select :model-value="field.value" @update:model-value="field.onChange">
                    <CommonVTooltip
                      content="게시글을 볼 때 요구되는 레벨을 설정합니다 (0 = 비회원도 가능)"
                    >
                      <SelectTrigger id="boardLevelView" :aria-invalid="!!errors.length">
                        <SelectValue placeholder="글보기" />
                      </SelectTrigger>
                    </CommonVTooltip>

                    <SelectContent position="item-aligned">
                      <SelectItem v-for="(_, lv) in 11" :key="lv" :value="lv">
                        Lv. {{ lv }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="levelWrite">
                <Field :data-invalid="!!errors.length">
                  <Select :model-value="field.value" @update:model-value="field.onChange">
                    <CommonVTooltip
                      content="게시글 작성시 요구되는 레벨을 설정합니다 (비회원은 작성불가)"
                    >
                      <SelectTrigger id="boardLevelWrite" :aria-invalid="!!errors.length">
                        <SelectValue placeholder="글작성" />
                      </SelectTrigger>
                    </CommonVTooltip>

                    <SelectContent position="item-aligned">
                      <SelectItem v-for="(lv, _) in 11" :key="lv" :value="lv">
                        Lv. {{ lv }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="levelComment">
                <Field :data-invalid="!!errors.length">
                  <Select :model-value="field.value" @update:model-value="field.onChange">
                    <CommonVTooltip
                      content="댓글 작성시 요구되는 레벨을 설정합니다 (비회원은 작성불가)"
                    >
                      <SelectTrigger id="boardLevelComment" :aria-invalid="!!errors.length">
                        <SelectValue placeholder="댓글작성" />
                      </SelectTrigger>
                    </CommonVTooltip>

                    <SelectContent position="item-aligned">
                      <SelectItem v-for="(lv, _) in 11" :key="lv" :value="lv">
                        Lv. {{ lv }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="levelDownload">
                <Field :data-invalid="!!errors.length">
                  <Select :model-value="field.value" @update:model-value="field.onChange">
                    <CommonVTooltip
                      content="첨부파일을 받을 때 요구되는 레벨을 설정합니다 (0 = 비회원도 가능)"
                    >
                      <SelectTrigger id="boardLevelDownload" :aria-invalid="!!errors.length">
                        <SelectValue placeholder="다운로드" />
                      </SelectTrigger>
                    </CommonVTooltip>

                    <SelectContent position="item-aligned">
                      <SelectItem v-for="(_, lv) in 11" :key="lv" :value="lv">
                        Lv. {{ lv }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </VeeField>
            </div>

            <div class="grid grid-cols-4 gap-1.5">
              <VeeField v-slot="{ field, errors }" name="pointView">
                <Field :data-invalid="!!errors.length">
                  <CommonVTooltip
                    content="게시글 보기시 차감/획득할 포인트를 설정합니다 (차감 ≤ 0 ≤ 획득)"
                  >
                    <Input
                      id="boardPointView"
                      v-bind="field"
                      autocomplete="off"
                      :aria-invalid="!!errors.length"
                    />
                  </CommonVTooltip>
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="pointWrite">
                <Field :data-invalid="!!errors.length">
                  <CommonVTooltip
                    content="게시글 작성시 차감/획득할 포인트를 설정합니다 (차감 ≤ 0 ≤ 획득)"
                  >
                    <Input
                      id="boardPointWrite"
                      v-bind="field"
                      autocomplete="off"
                      :aria-invalid="!!errors.length"
                    />
                  </CommonVTooltip>
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="pointComment">
                <Field :data-invalid="!!errors.length">
                  <CommonVTooltip
                    content="댓글 작성시 차감/획득할 포인트를 설정합니다 (차감 ≤ 0 ≤ 획득)"
                  >
                    <Input
                      id="boardPointComment"
                      v-bind="field"
                      autocomplete="off"
                      :aria-invalid="!!errors.length"
                    />
                  </CommonVTooltip>
                </Field>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="pointDownload">
                <Field :data-invalid="!!errors.length">
                  <CommonVTooltip
                    content="다운로드시 차감/획득할 포인트를 설정합니다 (차감 ≤ 0 ≤ 획득)"
                  >
                    <Input
                      id="boardPointDownload"
                      v-bind="field"
                      autocomplete="off"
                      :aria-invalid="!!errors.length"
                    />
                  </CommonVTooltip>
                </Field>
              </VeeField>
            </div>
          </FieldGroup>
        </form>
      </ScrollArea>

      <DialogFooter class="mt-4">
        <Button
          variant="outline"
          type="button"
          class="cursor-pointer"
          @click="closeCreateNewBoardDialog"
          >취소</Button
        >
        <Button
          type="submit"
          class="cursor-pointer text-foreground"
          form="createNewBoard"
          @click="onSubmit"
          >만들기</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod"
import { useNuboAdminContext } from "~/types/nubo-skin-keys"
import { useForm, Field as VeeField } from "vee-validate"
import { z } from "zod"
import { toast } from "vue-sonner"

const formSchema = toTypedSchema(
  z.object({
    id: z
      .string()
      .min(2, "게시판 ID는 영문 소문자 기준으로 최소 2글자 이상이어야 합니다.")
      .max(30, "게시판 ID는 영문 소문자 기준으로 최대 30글자 이하여야 합니다.")
      .regex(/^\w+$/, "게시판 ID는 영문 소문자, 숫자 및 언더스코어만 가능합니다."),

    name: z
      .string()
      .min(2, "게시판 이름은 2글자 이상이어야 합니다.")
      .max(20, "게시판 이름은 20글자 이하여야 합니다."),

    type: z.coerce
      .number({
        invalid_type_error: "숫자만 입력 가능합니다.",
      })
      .int("정수만 입력 가능합니다.")
      .min(0, "게시판 타입은 0 (= 게시판) 이상이어야 합니다.")
      .max(2, "게시판 타입은 2 (= 블로그) 이하여야 합니다.")
      .default(0),

    rowCount: z.coerce
      .number({
        invalid_type_error: "숫자만 입력 가능합니다.",
      })
      .int("정수만 입력 가능합니다.")
      .min(1, "게시판 목록은 최소 1개 이상의 게시글이 보여야 합니다.")
      .max(200, "게시판 목록은 최대 200개까지 출력 가능합니다.")
      .default(20),

    width: z.coerce
      .number({
        invalid_type_error: "숫자만 입력 가능합니다.",
      })
      .int("정수만 입력 가능합니다.")
      .min(350, "게시판 가로폭은 350px 이상이어야 합니다.")
      .max(8196, "게시판 최대폭은 8196px 이하여야 합니다.")
      .default(1000),

    info: z
      .string()
      .min(2, "게시판 설명은 2글자 이상이어야 합니다.")
      .max(100, "게시판 설명은 100글자 이하여야 합니다."),

    levelList: z.coerce
      .number({ invalid_type_error: "숫자만 입력 가능합니다." })
      .int("정수만 입력 가능합니다.")
      .min(0, "목록보기 레벨 제한은 0(=비회원) 이상이어야 합니다.")
      .max(10, "목록보기 레벨 제한은 10 이하여야 합니다.")
      .default(0),

    levelView: z.coerce
      .number({ invalid_type_error: "숫자만 입력 가능합니다." })
      .int("정수만 입력 가능합니다.")
      .min(0, "글보기 레벨 제한은 0(=비회원) 이상이어야 합니다.")
      .max(10, "글보기 레벨 제한은 10 이하여야 합니다.")
      .default(0),

    levelWrite: z.coerce
      .number({ invalid_type_error: "숫자만 입력 가능합니다." })
      .int("정수만 입력 가능합니다.")
      .min(1, "글 작성 레벨 제한은 1(=회원) 이상이어야 합니다.")
      .max(10, "글 작성 레벨 제한은 10 이하여야 합니다.")
      .default(1),

    levelComment: z.coerce
      .number({ invalid_type_error: "숫자만 입력 가능합니다." })
      .int("정수만 입력 가능합니다.")
      .min(1, "댓글 작성 레벨 제한은 1(=회원) 이상이어야 합니다.")
      .max(10, "댓글 작성 레벨 제한은 10 이하여야 합니다.")
      .default(1),

    levelDownload: z.coerce
      .number({ invalid_type_error: "숫자만 입력 가능합니다." })
      .int("정수만 입력 가능합니다.")
      .min(0, "다운로드 레벨 제한은 0(=비회원) 이상이어야 합니다.")
      .max(10, "다운로드 레벨 제한은 10 이하여야 합니다.")
      .default(0),

    pointView: z.coerce
      .number({ invalid_type_error: "숫자만 입력 가능합니다." })
      .int("정수만 입력 가능합니다.")
      .min(-100000, "글보기에 필요한 포인트는 -100,000 이상이어야 합니다. ")
      .max(100000, "글보기시 획득 가능한 포인트는 100,000 이하여야 합니다.")
      .default(0),

    pointWrite: z.coerce
      .number({ invalid_type_error: "숫자만 입력 가능합니다." })
      .int("정수만 입력 가능합니다.")
      .min(-100000, "글작성에 필요한 포인트는 -100,000 이상이어야 합니다.")
      .max(100000, "글작성시 획득 가능한 포인트는 100,000 이하여야 합니다.")
      .default(5),

    pointComment: z.coerce
      .number({ invalid_type_error: "숫자만 입력 가능합니다." })
      .int("정수만 입력 가능합니다.")
      .min(-100000, "댓글 작성에 필요한 포인트는 -100,000 이상이어야 합니다.")
      .max(100000, "댓글 작성시 획득 가능한 포인트는 100,000 이하여야 합니다.")
      .default(2),

    pointDownload: z.coerce
      .number({ invalid_type_error: "숫자만 입력 가능합니다." })
      .int("정수만 입력 가능합니다.")
      .min(-100000, "다운로드에 필요한 포인트는 -100,000 이상이어야 합니다.")
      .max(100000, "다운로드시 획득 가능한 포인트는 100,000 이하여야 합니다.")
      .default(-5),
  }),
)

const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema,
  initialValues: {
    id: "",
  },
})

const { isCreateNewBoardDialog, closeCreateNewBoardDialog } = useNuboAdminContext()

// 새 게시판 생성 요청 날리기
const onSubmit = handleSubmit(async (data) => {
  toast(`TBD`)
})

// 다이얼로그 창 상태 변화 확인
const handleOpenChange = (open: boolean) => {
  if (!open) {
    resetForm()
    closeCreateNewBoardDialog()
  }
}
</script>
