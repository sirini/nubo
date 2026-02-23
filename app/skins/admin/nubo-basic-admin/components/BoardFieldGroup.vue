<template>
  <FieldGroup class="gap-3">
    <BoardSelect
      name="groupUid"
      label="그룹 변경"
      :items="groupList"
      description="소속 그룹 변경"
    />

    <BoardField
      name="id"
      label="ID"
      :description="
        isModifying
          ? `한 번 생성된 게시판 ID는 수정불가`
          : `영문 소문자, 숫자 및 언더 스코어 기호만 가능`
      "
      :disabled="isModifying"
      placeholder="free"
    />

    <BoardField name="name" label="이름" description="이 게시판의 이름" placeholder="자유게시판" />

    <BoardSelect name="type" label="타입" :items="types" description="게시판의 형태 지정" />

    <BoardField
      name="rowCount"
      label="행 개수"
      description="한 페이지에 보여줄 게시글 수"
      placeholder="20"
    />

    <BoardField
      name="width"
      label="너비"
      description="게시판의 최대 가로폭 너비"
      placeholder="1000"
    />

    <BoardField
      name="info"
      label="설명"
      input-class="max-w-52"
      description="게시판에 대한 한줄 소개글"
      placeholder="자유롭게 이야기를 나누는 공간"
    />

    <BoardCheckbox name="useCategory" label="분류" description="카테고리 사용 여부 선택" />

    <div v-show="values.useCategory">
      <BoardField
        name="categories"
        label="분류들"
        input-class="max-w-52"
        description="분류명을 콤마(,)로 구분"
        placeholder="일반,유머,정보,구매"
      />
    </div>

    <Separator class="my-4" />

    <h2 class="text-xl">레벨 제한</h2>
    <p class="text-muted-foreground text-sm mb-4">
      사용자의 레벨에 따라 할 수 있는 작업들을 제한할 수 있습니다 (0 = 비회원)
    </p>

    <BoardSelect
      name="levelList"
      label="목록보기"
      :items="levels"
      description="목록을 볼 때 요구되는 레벨 (0 = 비회원)"
    />

    <BoardSelect
      name="levelView"
      label="글보기"
      :items="levels"
      description="글을 볼 때 요구되는 레벨 (0 = 비회원)"
    />

    <BoardSelect
      name="levelWrite"
      label="글작성"
      :items="levels.slice(1)"
      description="글 작성에 요구되는 레벨 (비회원은 불가)"
    />

    <BoardSelect
      name="levelComment"
      label="댓글작성"
      :items="levels.slice(1)"
      description="댓글 작성에 요구되는 레벨 (비회원은 불가)"
    />

    <BoardSelect
      name="levelDownload"
      label="다운로드"
      :items="levels"
      description="다운로드에 요구되는 레벨 (0 = 비회원)"
    />

    <Separator class="my-4" />

    <h2 class="text-xl">포인트 정책</h2>
    <p class="text-muted-foreground text-sm mb-4">
      사용자들의 포인트를 차감하거나 획득할 수 있도록 합니다
    </p>

    <BoardField
      name="pointView"
      label="글보기"
      description="글 보기 때 차감/획득할 포인트 설정 (차감 ≤ 0 ≤ 획득)"
      placeholder="0"
      input-class="w-16"
    />

    <BoardField
      name="pointWrite"
      label="글작성"
      description="글 작성시 차감/획득할 포인트 설정 (차감 ≤ 0 ≤ 획득)"
      placeholder="5"
      input-class="w-16"
    />

    <BoardField
      name="pointComment"
      label="댓글작성"
      description="댓글 작성시 차감/획득할 포인트 설정 (차감 ≤ 0 ≤ 획득)"
      placeholder="2"
      input-class="w-16"
    />

    <BoardField
      name="pointDownload"
      label="다운로드"
      description="다운로드시 차감/획득할 포인트 설정 (차감 ≤ 0 ≤ 획득)"
      placeholder="-5"
      input-class="w-16"
    />
  </FieldGroup>
</template>

<script setup lang="ts">
import { useFormValues } from "vee-validate"
import { BOARD } from "~/types/board"
import { useNuboAdminContext } from "~/types/nubo-skin-keys"
import BoardCheckbox from "./BoardCheckbox.vue"
import BoardField from "./BoardField.vue"
import BoardSelect from "./BoardSelect.vue"

const values = useFormValues()
const { groups } = useNuboAdminContext()
const isModifying = computed(() => values.value.boardUid > 0)

// 그룹 목록
const groupList = groups.value.map((grp) => ({ name: grp.id, value: grp.uid }))

// 게시판 형태들
const types = [
  { name: "게시판", value: BOARD.DEFAULT },
  { name: "갤러리", value: BOARD.GALLERY },
  { name: "블로그", value: BOARD.BLOG },
]

// 레벨 제한 목록
let levels = []
for (let lv = 0; lv < 11; lv++) {
  levels.push({ name: `Lv. ${lv}`, value: lv })
}
</script>
