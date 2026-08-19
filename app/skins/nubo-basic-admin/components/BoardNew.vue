<template>
  <form id="createNewBoard" class="p-4 sm:p-6" @submit="onSubmit">
    <FieldSet>
      <FieldLegend class="text-xl">새 게시판 만들기</FieldLegend>
      <FieldDescription>아래의 설정값으로 새로운 게시판을 생성합니다</FieldDescription>
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
        <CommonVTooltip content="위에 입력한 내용대로 게시판을 새로 추가합니다">
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
import { toast } from "vue-sonner"
import type { AdminBoardCreateParam } from "~/types/admin"
import { BOARD } from "~/types/board"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import BoardFieldGroup from "./BoardFieldGroup.vue"
import { useBoardFormSchema } from "./boardFormSchema"

const schema = useBoardFormSchema()
const { groupInfo, createBoard } = useNuboAdminContext()
const props = defineProps<{
  changePanel: (panel: "list" | "new" | "edit", boardId?: string) => Promise<void>
}>()

// 스키마 지정 및 초기값 설정
const { handleSubmit, resetForm } = useForm({
  validationSchema: schema.validationSchema,
  initialValues: {
    adminUid: 1,
    groupUid: groupInfo.value.config.uid,
    type: BOARD.DEFAULT,
    skinKey: "nubo-basic-board",
    categories: "일반,유머,정보",
    rowCount: 20,
    width: 1000,
    levelList: 0,
    levelView: 0,
    levelWrite: 1,
    levelComment: 1,
    levelDownload: 1,
    pointView: 0,
    pointWrite: 5,
    pointComment: 2,
    pointDownload: -5,
    useCategory: true,
  },
})

// 새 게시판 생성 요청 전송
const onSubmit = handleSubmit(
  async (data) => {
    const param = data as AdminBoardCreateParam
    const boardUid = await createBoard(param)
    if (boardUid > 0) {
      props.changePanel("list")
    }
  },
  ({ errors }) => {
    toast(`⚠️ 검증 오류: ${JSON.stringify(errors)}`)
  },
)
</script>
