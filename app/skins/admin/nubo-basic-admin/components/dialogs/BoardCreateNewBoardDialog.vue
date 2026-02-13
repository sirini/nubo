<template>
  <Dialog v-model:open="isCreateNewBoardDialog" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>새 게시판</DialogTitle>
        <DialogDescription>새로운 게시판을 추가합니다</DialogDescription>
      </DialogHeader>

      <div>
        <form id="createNewBoard" @submit="onSubmit">
          <FieldGroup>
            <VeeField v-slot="{ field, errors }" name="id">
              <Field :data-invalid="!!errors.length">
                <FieldLabel for="boardId">게시판 ID</FieldLabel>
                <Input
                  id="boardId"
                  v-bind="field"
                  placeholder="영문 소문자 및 숫자 조합만 가능합니다"
                  autocomplete="off"
                  :aria-invalid="!!errors.length"
                />
                <FieldError v-if="errors.length" :error="errors" />
              </Field>
            </VeeField>
          </FieldGroup>
        </form>
      </div>

      <DialogFooter>
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
      .max(30, "게시판 ID는 영문 소문자 기준으로 최대 30글자 이하여야 합니다."),
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
