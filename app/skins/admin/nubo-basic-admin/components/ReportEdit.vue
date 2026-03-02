<template>
  <form id="solveReport" @submit="onSubmit" class="p-6">
    <FieldSet>
      <FieldLegend class="text-xl">신고 대응</FieldLegend>
      <FieldDescription
        >신고를 받은
        <span class="text-primary font-semibold">{{ recoverChars(selectedReport.to.name) }}</span
        >님의 권한을 조정하고 조치 내역을 작성합니다</FieldDescription
      >

      <UserPermissionFieldGroup />
      <Separator />
      <InputTextarea
        name="request"
        label="신고내역"
        :description="`${recoverChars(selectedReport.from.name)}님이 신고하신 내용입니다`"
        :disabled="true"
        :placeholder="selectedReport.request"
      />
      <InputTextarea
        name="response"
        label="조치사항"
        description="※ 조치사항 입력 시 해결됨으로 이동합니다"
        placeholder="해당 사용자의 부정 행위에 대한 설명 및 대응 조치 작성"
      />
    </FieldSet>

    <div class="flex items-center justify-between mt-12">
      <CommonVTooltip content="신고 목록 화면으로 이동합니다">
        <Button
          variant="ghost"
          class="items-center gap-2 cursor-pointer"
          @click="changeStatus('wait')"
        >
          <ArrowLeftIcon class="w-4 h-4" />
          <span>뒤로</span>
        </Button>
      </CommonVTooltip>

      <CommonVTooltip content="조치 사항을 업데이트 합니다">
        <Button class="items-center gap-2 cursor-pointer text-foreground" @click="onSubmit">
          <SquareCheckBigIcon class="w-4 h-4" />
          <span>제출</span>
        </Button>
      </CommonVTooltip>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, SquareCheckBigIcon } from "lucide-vue-next"
import { useForm } from "vee-validate"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import type { AdminReportItem } from "~/types/admin"
import type { UserPermissionManageParam } from "~/types/user"
import InputTextarea from "./InputTextarea.vue"
import { useReportFormSchema } from "./reportFormSchema"
import UserPermissionFieldGroup from "./UserPermissionFieldGroup.vue"

const props = defineProps<{
  changeStatus: Function
  selectedReport: AdminReportItem
}>()
const schema = useReportFormSchema()
const { changeUserPermission, getUserPermission } = useNuboAdminContext()
const permission = await getUserPermission(props.selectedReport.to.uid)

// 스키마 지정 및 기존 값들 가져오기
const { handleSubmit } = useForm({
  validationSchema: schema.validationSchema,
  initialValues: permission,
})

// 조치사항 전송
const onSubmit = handleSubmit(
  async (data) => {
    const param = data as UserPermissionManageParam
    await changeUserPermission(param)
    props.changeStatus("solved")
  },
  ({ errors, values, results }) => {
    // toast(`⚠️ 검증 오류: ${JSON.stringify(errors)}`)
  },
)
</script>
