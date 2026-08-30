<template>
  <Dialog v-model:open="isOpenReportForm">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>사용자 신고</DialogTitle>
        <DialogDescription>신고 사유를 선택하고 필요한 내용을 알려주세요.</DialogDescription>
      </DialogHeader>
      <div class="grid gap-5">
        <template v-if="!isReportedUser">
          <ToggleGroup v-model="reportReason" type="single" variant="outline" class="flex flex-wrap justify-start gap-2">
            <ToggleGroupItem v-for="reason in reportReasons" :key="reason.label" :value="reason.description" class="cursor-pointer" @click="reportDescription = reason.description">{{ reason.label }}</ToggleGroupItem>
          </ToggleGroup>
          <Textarea v-model="reportDescription" placeholder="상세한 신고 이유를 입력해 주세요" class="min-h-28 resize-none" />
          <Button :disabled="!reportDescription" class="cursor-pointer" @click="reportBadUser">신고 제출</Button>
        </template>
        <p v-else class="rounded-lg border p-6 text-center text-sm text-muted-foreground">이미 신고한 사용자입니다.</p>
        <Button variant="outline" class="cursor-pointer" @click="closeReportForm">닫기</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useNuboProfileContext } from "~/providers/contexts/profile"

const { closeReportForm, isOpenReportForm, isReportedUser, reportBadUser, reportDescription, reportReason, reportReasons } = useNuboProfileContext()
</script>
