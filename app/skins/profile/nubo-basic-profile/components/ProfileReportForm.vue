<template>
  <div class="grid gap-4">
    <div v-if="!isReportedUser">
      <div class="space-y-6">
        <ToggleGroup
          v-model="reportReason"
          type="single"
          variant="outline"
          class="flex flex-wrap justify-start gap-2"
        >
          <ToggleGroupItem
            v-for="(reason, index) in reportReasons"
            :content="reason.description"
            :key="index"
            :value="reason.description"
            @click="reportDescription = reason.description"
            class="px-2 py-2 data-[state=on]:bg-primary data-[state=on]:text-foreground transition-colors cursor-pointer"
          >
            {{ reason.label }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div class="space-y-3 mt-6">
        <div class="text-sm font-medium text-muted-foreground">상세 내용</div>
        <Textarea
          v-model="reportDescription"
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
          v-model="isCheckedBlackList"
          :disabled="isReportedUser"
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
        @click="reportBadUser"
        :disabled="!reportDescription"
        class="text-foreground cursor-pointer"
        v-if="!isReportedUser"
      >
        신고 제출하기
      </Button>
    </CommonVTooltip>

    <Button @click="closeReportForm" variant="outline" class="cursor-pointer">닫기</Button>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2Icon } from "lucide-vue-next"
import { useNuboProfileContext } from "~/providers/contexts/profile"

const {
  reportReasons,
  isReportedUser,
  reportReason,
  reportDescription,
  isCheckedBlackList,
  reportBadUser,
  closeReportForm,
} = useNuboProfileContext()
</script>
