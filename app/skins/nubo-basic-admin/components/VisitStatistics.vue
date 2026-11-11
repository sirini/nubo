<template>
  <div class="space-y-3 rounded-md border p-4">
    <h2 class="font-semibold">방문 추이</h2>
    <p class="text-xs text-muted-foreground">페이지 접속 건수이며 순 방문자 수가 아닙니다. KST 기준이며 보존기간 내 기록만 집계합니다. 브라우저에서 기록을 차단하면 누락될 수 있습니다.</p>
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="load">
      <label class="text-sm">연도<input v-model="year" type="number" min="2000" max="9999" required class="ml-2 w-24 rounded border bg-background p-2" /></label>
      <label class="text-sm">집계<select v-model="unit" class="ml-2 rounded border bg-background p-2"><option value="day">일별</option><option value="month">월별</option><option value="year">연별</option></select></label>
      <Button variant="outline" :disabled="pending">통계 조회</Button>
    </form>
    <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
    <p v-if="result" class="text-sm">총 {{ total.toLocaleString() }}회 · {{ result.manualDeletionOnly ? "계속 보관(자동 만료 없음)" : `보존 ${result.retentionDays}일` }}</p>
    <div v-if="rows.length" class="max-h-96 space-y-2 overflow-auto" aria-label="기간별 페이지 접속 그래프">
      <div v-for="[date, count] in rows" :key="date" class="flex items-center gap-3 text-xs">
        <span class="w-24 shrink-0">{{ date }}</span><div class="h-3 flex-1 rounded bg-muted"><div class="h-3 rounded bg-primary" :style="{ width: `${count / maximum * 100}%` }"></div></div><span class="w-16 text-right">{{ count }}</span>
      </div>
    </div>
    <p v-else-if="result" class="text-sm text-muted-foreground">보존기간 내 집계할 기록이 없습니다.</p>
  </div>
</template>
<script setup lang="ts">
import { kstDateKey } from "~/utils/securityLogTime"
type Statistics = { timezone: string; manualDeletionOnly?: boolean; counts: Record<string, number>; retentionDays: number }
const config = useRuntimeConfig()
const year = ref(Number(kstDateKey().slice(0, 4)))
const unit = ref("month")
const pending = ref(false)
const error = ref("")
const result = ref<Statistics>()
const rows = computed(() => Object.entries(result.value?.counts ?? {}).sort(([a], [b]) => a.localeCompare(b)))
const total = computed(() => rows.value.reduce((sum, [, count]) => sum + count, 0))
const maximum = computed(() => Math.max(1, ...rows.value.map(([, count]) => count)))
async function load() {
  pending.value = true; error.value = ""
  try {
    const data = await $fetch<Statistics>("/admin/system/visit-statistics", { baseURL: config.public.apiBase, query: { year: year.value, unit: unit.value, timezone: "Asia/Seoul" } })
    if (!data.counts || typeof data.retentionDays !== "number" || data.timezone !== "Asia/Seoul") throw new Error("Invalid statistics")
    result.value = data
  } catch { result.value = undefined; error.value = "방문 통계를 불러오지 못했습니다." }
  finally { pending.value = false }
}
onMounted(load)
</script>
