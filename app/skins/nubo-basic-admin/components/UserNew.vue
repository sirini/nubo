<template>
  <form id="createNewAccount" class="p-4 sm:p-6" @submit="onSubmit">
    <FieldSet>
      <FieldLegend class="text-xl">새 사용자 계정 만들기</FieldLegend>
      <FieldDescription>아래의 설정값으로 새로운 사용자 계정을 생성합니다</FieldDescription>
      <UserFieldGroup />
    </FieldSet>

    <div class="flex items-center justify-between mt-12">
      <div class="space-x-2">
        <CommonVTooltip content="사용자 목록 보기 화면으로 이동합니다">
          <Button
            type="button"
            variant="ghost"
            class="items-center gap-2 cursor-pointer"
            @click="changePanel('list')"
          >
            <ArrowLeftIcon class="w-4 h-4" />
            <span>뒤로</span>
          </Button>
        </CommonVTooltip>

        <CommonVTooltip content="입력한 내용들을 모두 초기화합니다">
          <Button
            type="button"
            variant="ghost"
            class="items-center gap-2 cursor-pointer"
            @click="resetForm"
          >
            <RotateCcwIcon class="w-4 h-4" />
            <span>초기화</span>
          </Button>
        </CommonVTooltip>
      </div>

      <div>
        <CommonVTooltip content="위에 입력한 내용대로 새 사용자 계정을 추가합니다">
          <Button type="submit" class="items-center gap-2 cursor-pointer text-foreground">
            <SquareCheckBigIcon class="w-4 h-4" />
            <span>제출</span>
          </Button>
        </CommonVTooltip>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, RotateCcwIcon, SquareCheckBigIcon } from "lucide-vue-next"
import { useForm } from "vee-validate"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import type { AdminUserCreateParam } from "~/types/admin"
import UserFieldGroup from "./UserFieldGroup.vue"
import { useUserFormSchema } from "./userFormSchema"

const schema = useUserFormSchema()
const { createUser } = useNuboAdminContext()
const props = defineProps<{ changePanel: (panel: "list") => void }>()

// 스키마 지정 및 초기값 설정
const { handleSubmit, resetForm } = useForm({
  validationSchema: schema.newValidationSchema,
  initialValues: {
    id: "tsboard@nubohub.org",
    name: "홍길동",
    password: "",
    confirmPassword: "",
    profile: null,
    oldProfile: "",
    level: 1,
    point: 100,
    signature: "",
  },
})

// 새 사용자 계정 생성 요청 전송
const onSubmit = handleSubmit(
  async (data) => {
    const param = data as AdminUserCreateParam
    const userUid = await createUser(param)
    if (userUid > 1) {
      props.changePanel("list")
    }
  },
  () => undefined,
)
</script>
