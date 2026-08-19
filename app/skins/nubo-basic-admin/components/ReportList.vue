<template>
  <div class="space-y-3 p-4 md:hidden">
    <Card v-for="report in latestReports" :key="report.uid" class="p-4">
      <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="font-semibold">{{ report.from.name }} → {{ report.to.name }}</p><p class="mt-2 line-clamp-3 text-sm text-muted-foreground">{{ report.request }}</p></div><Button size="sm" variant="outline" @click="changeStatus('edit', report)">처리</Button></div>
      <p class="mt-3 text-xs text-muted-foreground">{{ date(report.date) }}</p>
    </Card>
    <div v-if="latestReports.length === 0" class="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
      <CircleCheckBigIcon class="mb-3 size-8 text-muted-foreground" />
      <p class="font-medium">표시할 신고가 없습니다</p>
      <p class="mt-1 text-sm text-muted-foreground">현재 상태에 해당하는 신고가 들어오면 여기에 표시됩니다.</p>
    </div>
  </div>
  <Table class="hidden md:table">
    <TableHeader>
      <TableRow>
        <TableHead class="text-center">신고자</TableHead>
        <TableHead class="text-center">신고 내역</TableHead>
        <TableHead class="text-center">시간</TableHead>
        <TableHead class="text-center">작업</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-if="latestReports.length === 0"><TableCell colspan="4" class="h-48 text-center text-muted-foreground">표시할 신고가 없습니다.</TableCell></TableRow>
      <TableRow v-for="report in latestReports" :key="report.uid">
        <TableCell class="flex items-center gap-2 truncate max-w-40">
          <Avatar class="ml-2">
            <AvatarImage :src="report.from.profile" alt="profile image" />
            <AvatarFallback class="text-xs">{{ report.from.name.substring(0, 2) }}</AvatarFallback>
          </Avatar>
          {{ recoverChars(report.from.name) }}
        </TableCell>
        <TableCell class="text-center max-w-50 whitespace-pre-wrap text-xs">
          {{ recoverChars(report.request) }}
        </TableCell>
        <TableCell class="text-center">
          <Badge variant="outline" class="text-muted-foreground">
            {{ date(report.date) }}
          </Badge>
        </TableCell>
        <TableCell>
          <div class="flex items-center justify-center">
            <CommonVTooltip content="신고 조치사항 및 해결 여부를 설정합니다">
              <Button
                variant="outline"
                size="icon"
                class="w-8 h-8 cursor-pointer"
                @click="changeStatus('edit', report)"
              >
                <Settings2Icon class="w-4 h-4" />
              </Button>
            </CommonVTooltip>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

<script setup lang="ts">
import { CircleCheckBigIcon, Settings2Icon } from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import type { AdminReportItem } from "~/types/admin"

const { latestReports } = useNuboAdminContext()
defineProps<{
  changeStatus: (status: "solved" | "wait" | "edit", report?: AdminReportItem | null) => Promise<void>
}>()
</script>
