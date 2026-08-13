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
            :key="index"
            :content="reason.description"
            :value="reason.description"
            class="cursor-pointer px-2 py-2 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            @click="reportDescription = reason.description"
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
        for="checkBlackList"
        class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-accent/30 has-aria-checked:border-primary has-aria-checked:bg-primary/5 dark:has-aria-checked:bg-primary/10"
      >
        <Checkbox
          id="checkBlackList"
          v-model="isCheckedBlackList"
          :disabled="isReportedUser"
          class="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
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
        v-if="!isReportedUser"
        :disabled="!reportDescription"
        class="text-foreground cursor-pointer"
        @click="reportBadUser"
      >
        신고 제출하기
      </Button>
    </CommonVTooltip>

    <Button variant="outline" class="cursor-pointer" @click="closeReportForm">닫기</Button>
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
