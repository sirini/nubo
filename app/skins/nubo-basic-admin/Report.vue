<template>
  <div class="flex w-full bg-background h-full">
    <aside class="hidden w-48 border-r bg-muted/20 md:flex flex-col">
      <div class="p-4 border-b flex items-center justify-between h-16">
        <h3 class="font-semibold flex items-center gap-2">
          <FunnelIcon class="w-4 h-4" /> 신고 분류
        </h3>
      </div>

      <ScrollArea class="max-h-[calc(100dvh-215px)]">
        <div class="flex-1 space-y-2 p-4">
          <Button
            class="w-full flex items-center justify-start px-3 py-2 text-sm rounded-md transition-colors cursor-pointer"
            :class="
              status === 'wait'
                ? 'bg-muted text-foreground font-medium'
                : 'hover:bg-muted bg-transparent text-muted-foreground opacity-70'
            "
            @click="changeStatus('wait')"
          >
            <HourglassIcon class="w-4 h-4" />
            <span>대기중</span>
          </Button>

          <Button
            class="w-full flex items-center justify-start px-3 py-2 text-sm rounded-md transition-colors cursor-pointer"
            :class="
              status === 'solved'
                ? 'bg-muted text-foreground font-medium'
                : 'hover:bg-muted bg-transparent text-muted-foreground opacity-70'
            "
            @click="changeStatus('solved')"
          >
            <CircleCheckBigIcon class="w-4 h-4" />
            <span>해결됨</span>
          </Button>
        </div>
      </ScrollArea>
    </aside>

    <main class="flex-1 flex flex-col min-w-0">
      <header class="p-4 border-b flex items-center justify-between bg-card h-16">
        <h2 class="text-xl font-bold flex items-center gap-3" v-if="status === 'wait'">
          <HourglassIcon class="w-5 h-5" />
          미해결된 신고들
        </h2>

        <h2 class="text-xl font-bold flex items-center gap-3" v-else>
          <CircleCheckBigIcon class="w-5 h-5" />
          해결됨
        </h2>
      </header>

      <ScrollArea class="h-[calc(100dvh-215px)]">
        <ReportEdit
          :change-status="changeStatus"
          :selected-report="selectedReport"
          v-if="status === 'edit'"
        />
        <ReportList :change-status="changeStatus" v-else />
      </ScrollArea>
    </main>
  </div>
</template>

<script setup lang="ts">
import { CircleCheckBigIcon, FunnelIcon, HourglassIcon } from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import type { AdminReportItem } from "~/types/admin"
import { BOARD_WRITER, SEARCH, type Search } from "~/types/board"
import ReportEdit from "./components/ReportEdit.vue"
import ReportList from "./components/ReportList.vue"

type Status = "solved" | "wait" | "edit"
const selectedReport = ref<AdminReportItem>({
  uid: 0,
  to: BOARD_WRITER,
  from: BOARD_WRITER,
  request: "",
  response: "",
  date: Date.now(),
  solved: false,
})
const status = ref<Status>("wait")
const { page, option, keyword, loadInitReportList } = useNuboAdminContext()

// 마운트 시점에서 신고 목록 가져오기
onMounted(async () => {
  page.value = 1
  option.value = SEARCH.REPORT.REQUEST as Search
  keyword.value = ""

  await loadInitReportList(status.value === "solved")
})

// 신고 목록 영역 내용 변경하기
const changeStatus = async (s: Status, editReport: AdminReportItem | null = null) => {
  status.value = s
  if (editReport) {
    selectedReport.value = editReport
  }
  await loadInitReportList(s === "solved")
}
</script>
