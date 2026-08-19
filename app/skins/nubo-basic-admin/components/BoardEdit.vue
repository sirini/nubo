<template>
  <form id="modifyExistBoard" class="p-4 sm:p-6" @submit="onSubmit">
    <FieldSet>
      <FieldLegend class="text-xl">{{ selectedBoardId }} 게시판 수정하기</FieldLegend>
      <FieldDescription
        >기존 설정들을 검토하고 수정하거나, 게시판을 삭제할 수 있습니다</FieldDescription
      >
      <BoardFieldGroup />
    </FieldSet>

    <div class="flex items-center justify-between mt-12">
      <div class="space-x-2">
        <CommonVTooltip content="게시판 목록 보기 화면으로 이동합니다">
          <Button
            variant="ghost"
            class="items-center gap-2 cursor-pointer"
            type="button"
            @click="changePanel('list')"
          >
            <ArrowLeftIcon class="w-4 h-4" />
            <span>뒤로</span>
          </Button>
        </CommonVTooltip>

        <CommonVTooltip :content="`${selectedBoardId} 게시판을 삭제합니다`">
          <Button
            type="button"
            variant="ghost"
            class="items-center gap-2 cursor-pointer text-red-400"
            @click="openBoardRemoveConfirmDialog(cfg.config.uid, cfg.config.name)"
          >
            <Trash2Icon class="w-4 h-4" />
            <span>삭제</span>
          </Button>
        </CommonVTooltip>
      </div>

      <div>
        <CommonVTooltip :content="`${selectedBoardId} 게시판을 수정합니다`">
          <Button type="submit" class="items-center gap-2 cursor-pointer text-foreground">
            <SquareCheckBigIcon class="w-4 h-4" />
            <span>수정</span>
          </Button>
        </CommonVTooltip>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, SquareCheckBigIcon, Trash2Icon } from "lucide-vue-next"
import { useForm } from "vee-validate"
import { toast } from "vue-sonner"
import type { AdminBoardModifyParam, AdminBoardResult } from "~/types/admin"
import { BOARD_CONFIG } from "~/types/board"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import BoardFieldGroup from "./BoardFieldGroup.vue"
import { useBoardFormSchema } from "./boardFormSchema"

const schema = useBoardFormSchema()
const { groupInfo, getBoardConfig, modifyBoard, openBoardRemoveConfirmDialog } =
  useNuboAdminContext()
const props = defineProps<{
  selectedBoardId: string
  changePanel: (panel: "list" | "new" | "edit", boardId?: string) => Promise<void>
}>()
const cfg = ref<AdminBoardResult>({ config: BOARD_CONFIG, groups: [] })
const setting = await getBoardConfig(props.selectedBoardId)

cfg.value.config = setting.config

// 스키마 지정 및 기존 값들 가져오기
const cats = setting.config.category.map((cat) => cat.name).join(",")
const { handleSubmit } = useForm({
  validationSchema: schema.validationSchema,
  initialValues: {
    adminUid: setting.config.admin.board,
    boardUid: setting.config.uid,
    groupUid: groupInfo.value.config.uid,
    id: props.selectedBoardId,
    name: setting.config.name,
    info: setting.config.info,
    type: setting.config.type,
    skinKey: setting.config.skinKey,
    categories: cats,
    rowCount: setting.config.rowCount,
    width: setting.config.width,
    levelList: setting.config.level.list,
    levelView: setting.config.level.view,
    levelWrite: setting.config.level.write,
    levelComment: setting.config.level.comment,
    levelDownload: setting.config.level.download,
    pointView: setting.config.point.view,
    pointWrite: setting.config.point.write,
    pointComment: setting.config.point.comment,
    pointDownload: setting.config.point.download,
    useCategory: setting.config.useCategory,
  },
})

// 기존 게시판 수정 요청 전송
const onSubmit = handleSubmit(
  async (data) => {
    const param = data as AdminBoardModifyParam
    const isDone = await modifyBoard(param)
    if (isDone) {
      props.changePanel("list")
    }
  },
  ({ errors }) => {
    toast(`⚠️ 검증 오류: ${JSON.stringify(errors)}`)
  },
)
</script>
