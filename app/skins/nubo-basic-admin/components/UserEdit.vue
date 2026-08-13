<template>
  <form id="modifyUserAccount" class="p-4 sm:p-6" @submit="onEditSubmit">
    <FieldSet>
      <FieldLegend class="text-xl">사용자 계정 수정하기</FieldLegend>
      <FieldDescription>사용자 계정 정보를 수정하거나 삭제할 수 있습니다</FieldDescription>
      <UserFieldGroup />
      <Separator />
      <UserPermissionFieldGroup />
    </FieldSet>

    <div class="flex items-center justify-between mt-12">
      <div class="space-x-2">
        <CommonVTooltip content="사용자 목록 보기 화면으로 이동합니다">
          <Button
            variant="ghost"
            class="items-center gap-2 cursor-pointer"
            @click="changePanel('list')"
          >
            <ArrowLeftIcon class="w-4 h-4" />
            <span>뒤로</span>
          </Button>
        </CommonVTooltip>

        <CommonVTooltip :content="`${user.name} 사용자 계정을 삭제합니다`">
          <Button
            type="button"
            variant="ghost"
            class="items-center gap-2 cursor-pointer text-red-400"
            @click="openUserRemoveConfirmDialog(user.uid, user.name)"
          >
            <Trash2Icon class="w-4 h-4" />
            <span>삭제</span>
          </Button>
        </CommonVTooltip>
      </div>

      <div>
        <CommonVTooltip content="위에 입력한 내용대로 새 사용자 계정을 추가합니다">
          <Button class="items-center gap-2 cursor-pointer text-foreground" @click="onEditSubmit">
            <SquareCheckBigIcon class="w-4 h-4" />
            <span>제출</span>
          </Button>
        </CommonVTooltip>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, SquareCheckBigIcon, Trash2Icon } from "lucide-vue-next"
import { useForm } from "vee-validate"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import type { AdminUserModifyParam } from "~/types/admin"
import type { UserPermissionManageParam } from "~/types/user"
import UserFieldGroup from "./UserFieldGroup.vue"
import { useUserFormSchema } from "./userFormSchema"
import UserPermissionFieldGroup from "./UserPermissionFieldGroup.vue"

const props = defineProps<{
  selectedUserUid: number
  changePanel: Function
}>()
const schema = useUserFormSchema()
const {
  changeUserPermission,
  modifyUser,
  getUserInfo,
  getUserPermission,
  openUserRemoveConfirmDialog,
} = useNuboAdminContext()
const user = await getUserInfo(props.selectedUserUid)
const permission = await getUserPermission(user.uid)

// 스키마 지정 및 기존 값들 가져오기
const { handleSubmit } = useForm({
  validationSchema: schema.modifyValidationSchema,
  initialValues: {
    id: user.id,
    name: recoverChars(user.name),
    profile: null,
    oldProfile: user.profile,
    level: user.level,
    point: user.point,
    signature: recoverChars(user.signature),
    ...permission,
  },
})

// 사용자 정보 수정 요청 전송
const onEditSubmit = handleSubmit(
  async (data) => {
    const modifyParam: AdminUserModifyParam = {
      id: data.id,
      name: data.name,
      password: data.password || "",
      profile: data.profile,
      oldProfile: data.oldProfile,
      level: data.level,
      point: data.point,
      signature: data.signature,
      userUid: data.userUid || 0,
    }
    const isDone = await modifyUser(modifyParam)

    const permParam: UserPermissionManageParam = {
      writePost: data.writePost,
      writeComment: data.writeComment,
      sendChatMessage: data.sendChatMessage,
      sendReport: data.sendReport,
      login: data.login,
      userUid: data.userUid || 0,
      response: "",
    }

    await changeUserPermission(permParam)

    if (isDone) {
      props.changePanel("list")
    }
  },
  ({ errors, values, results }) => {
    // toast(`⚠️ 검증 오류: ${JSON.stringify(errors)}`)
  },
)
</script>
