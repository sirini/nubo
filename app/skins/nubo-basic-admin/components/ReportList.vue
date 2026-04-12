<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="text-center">신고자</TableHead>
        <TableHead class="text-center">신고 내역</TableHead>
        <TableHead class="text-center">시간</TableHead>
        <TableHead class="text-center">작업</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
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
import { Settings2Icon } from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"

const { latestReports } = useNuboAdminContext()
const props = defineProps<{
  changeStatus: Function
}>()
</script>
