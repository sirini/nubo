<template>
  <div class="grid gap-4">
    <div v-if="!report.isReported">
      <div class="space-y-6">
        <ToggleGroup
          v-model="report.selectedReason"
          type="single"
          variant="outline"
          class="flex flex-wrap justify-start gap-2"
        >
          <ToggleGroupItem
            v-for="(reason, index) in reasons"
            :content="reason.description"
            :key="index"
            :value="reason.description"
            @click="report.description = reason.description"
            class="px-2 py-2 data-[state=on]:bg-primary data-[state=on]:text-foreground transition-colors cursor-pointer"
          >
            {{ reason.label }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div class="space-y-3 mt-6">
        <div class="text-sm font-medium text-muted-foreground">상세 내용</div>
        <Textarea
          v-model="report.description"
          placeholder="위에서 신고 사유를 선택하거나, 기타 선택 후 여기에 직접 입력해 주세요"
          class="resize-none"
        />
      </div>
    </div>

    <div
      v-else
      class="flex items-center justify-center text-sm h-20 text-muted-foreground border rounded-lg shadow-md"
    >
      <CheckCircle2Icon class="w-4 h-4 mr-2" /> 이미 신고하신 사용자입니다
    </div>

    <div class="space-y-3 mt-6">
      <div class="text-sm font-medium text-muted-foreground">내 블랙리스트에 추가</div>
      <Label
        class="hover:bg-accent/30 flex items-start gap-3 rounded-lg border p-4 has-aria-checked:border-blue-900 has-aria-checked:bg-blue-950 cursor-pointer"
      >
        <Checkbox
          v-model="report.isCheckedBlackList"
          :disabled="report.isReported"
          class="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
        />
        <div class="grid gap-1.5 font-normal">
          <div class="text-sm leading-none font-medium">내 블랙리스트에 추가</div>
          <div class="text-muted-foreground text-xs">
            이 사용자가 남긴 게시글/댓글들이 더 이상 나에게 노출되지 않도록 합니다
          </div>
        </div>
      </Label>
    </div>

    <CommonVTooltip content="허위 신고 시 제재될 수 있습니다">
      <Button
        @click="report.send"
        :disabled="!report.description"
        class="text-foreground cursor-pointer"
        v-if="!report.isReported"
      >
        신고 제출하기
      </Button>
    </CommonVTooltip>

    <Button @click="report.close" variant="outline" class="cursor-pointer">닫기</Button>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2Icon } from "lucide-vue-next"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"

const report = useReportStore()
const reasons = [
  {
    label: "스팸/광고",
    description: "스팸(광고/홍보), 도배, 타 사이트 홍보, 불법 사이트 링크 작성",
  },
  {
    label: "언어/태도",
    description: "욕설(비속어) 사용, 인신 공격, 비하 발언, 혐오 표현, 분쟁/어그로 유도글 작성",
  },
  {
    label: "정치/사회",
    description: "정치 선동 및 특정 진영 옹호, 정치 관련 분쟁 유도, 사회적 갈등 조장글 작성",
  },
  {
    label: "선정/폭력",
    description:
      "음란물 및 선정적인 내용 작성, 미성년자 관련 부적절한 콘텐츠, 과도한 폭력 및 잔인한 표현, 불쾌감을 주는 이미지 게시",
  },
  {
    label: "사기/허위",
    description: "허위 정보나 가짜 뉴스 작성, 검증되지 않은 정보 유포, 사기 피해 유도",
  },
  {
    label: "기타(직접 입력)",
    description: "",
  },
]

onMounted(() => report.loadReportStatus())
</script>
