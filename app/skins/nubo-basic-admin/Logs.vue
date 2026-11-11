<template>
  <section class="space-y-5 p-4 sm:p-6">
    <h1 class="text-xl font-semibold">관리자 콘솔 · 접속 기록</h1>
    <p class="text-sm leading-6 text-muted-foreground">방문자 페이지 접속·관리자 화면 방문·API 작업 기록을 확인합니다. 본문·이메일·토큰·검색어는 기록하지 않습니다. 시각과 날짜는 UTC 기준입니다.</p>
    <VisitStatistics :key="statisticsRevision" />
    <div class="flex flex-wrap items-end gap-3">
      <label class="space-y-1 text-sm">기록 유형<select v-model="kind" :disabled="deleting" class="block rounded-md border bg-background px-3 py-2" @change="offset = 0; load()"><option value="visits">방문자 접속 기록</option><option value="logs">단기 운영 로그</option><option value="audit">관리자 감사 기록</option></select></label>
      <label class="space-y-1 text-sm">조회 날짜 (UTC)<input v-model="day" :disabled="deleting" type="date" class="block rounded-md border bg-background px-3 py-2" @change="offset = 0; load()" /></label>
      <Button variant="outline" :disabled="pending" @click="load">조회</Button>
      <label class="space-y-1 text-sm">CSV 제출 목적<select v-model="exportPurpose" class="block rounded-md border bg-background px-3 py-2"><option value="privacy-review">개인정보 보호 점검</option><option value="incident-response">보안 사고 대응</option><option value="authority-submission">권한 있는 기관 제출</option></select></label>
      <Button :disabled="downloading" @click="download">{{ downloading ? '준비 중…' : 'CSV 내려받기' }}</Button>
    </div>
    <p v-if="errorMessage" role="alert" class="text-sm text-destructive">{{ errorMessage }}</p>
    <template v-if="result">
      <p class="text-sm text-muted-foreground">보관: {{ result.manualDeletionOnly ? "관리자가 직접 삭제할 때까지 계속 보관" : `최근 ${result.retentionDays}일` }} · 연결 주소: {{ result.fullIP ? '접속지 원문(접근 제한)' : result.maskedIP ? '마스킹' : '미보관' }} · 페이지당 최대 100건</p>
      <p v-if="result.integrityChecked" class="text-sm text-muted-foreground">HMAC 연결·일별 봉인 검증 통과. 파일 전체 삭제·서버 권한 탈취 등에 대비한 별도 안전 보관도 필요합니다.</p>
      <p v-if="result.writeError || result.dropped" role="alert" class="text-sm text-destructive">일부 기록이 누락될 수 있습니다. 저장 오류: {{ result.writeError ? '있음' : '없음' }} · 일일 용량 초과로 생략된 기록(현재 프로세스): {{ result.dropped }}건</p>
      <p class="text-xs leading-6 text-muted-foreground">접속지는 신뢰 프록시 설정에 따라 원 접속지 또는 직접 연결 주소입니다. 프록시 설정이 없으면 실제 이용자 주소와 다릅니다. 회원 번호 0은 인증된 회원이 확인되지 않은 요청입니다. HTTP 200도 업무 처리가 성공했다는 보장은 아닙니다.</p>
      <div class="overflow-x-auto rounded-md border">
        <table class="w-full whitespace-nowrap text-left text-xs">
          <thead class="bg-muted"><tr><th v-for="label in ['시각 (UTC)', '방식', '방문 페이지 / API 경로', 'HTTP / 업무 코드', '소요(ms)', '회원 번호', '연결 주소', '대상 회원', '단계', '대상 날짜', '목적 / 삭제 사유']" :key="label" class="p-3">{{ label }}</th></tr></thead>
          <tbody><tr v-for="(entry, index) in result.items" :key="index" class="border-t"><td class="p-3">{{ entry.time }}</td><td class="p-3">{{ entry.method }}</td><td class="p-3">{{ entry.route }}</td><td class="p-3">{{ entry.status }} / {{ entry.resultCode ?? '—' }}</td><td class="p-3">{{ entry.durationMs }}</td><td class="p-3">{{ entry.actor || '0' }}</td><td class="p-3">{{ entry.peer || '—' }}</td><td class="p-3">{{ entry.subjects?.join(', ') || '—' }}</td><td class="p-3">{{ entry.phase || '—' }}</td><td class="p-3">{{ entry.reference || '—' }}</td><td class="p-3">{{ purposeLabels[entry.purpose || ''] || entry.purpose || '—' }}</td></tr></tbody>
        </table>
        <p v-if="result.items.length === 0" class="p-5 text-sm text-muted-foreground">해당 날짜에 조회할 기록이 없습니다.</p>
      </div>
      <div class="flex gap-3"><Button variant="outline" :disabled="offset === 0 || pending" @click="offset = Math.max(0, offset - 100); load()">이전</Button><Button variant="outline" :disabled="!result.next || pending" @click="offset = result.next; load()">다음</Button></div>
    </template>
    <div v-if="manualDeletionEnabled" class="space-y-3 rounded-md border border-destructive/40 p-4 text-sm">
      <h2 class="font-semibold">선택한 날짜의 기록 삭제</h2>
      <p>{{ kind === 'audit' ? '관리자 감사' : '방문자 접속' }} 기록 중 {{ day }} (UTC)의 전체 기록을 영구 삭제합니다. 해당 날짜의 방문 통계도 사라집니다. 복구할 수 없으므로 회사의 최소 보관기간·보존 지시를 확인하세요. 당일·미래 날짜는 삭제할 수 없습니다.</p>
      <label class="block">삭제 사유<select v-model="deleteReason" :disabled="deleting" class="ml-2 rounded border bg-background p-2"><option value="retention-policy">조직의 보관 정책에 따른 정리</option><option value="privacy-request">개인정보 처리 요청 조치</option><option value="test-cleanup">테스트 기록 정리</option></select></label>
      <label class="block">삭제 날짜를 직접 입력<input v-model="deleteConfirmDate" :disabled="deleting" placeholder="YYYY-MM-DD" class="ml-2 rounded border bg-background p-2" /></label>
      <label class="block"><input v-model="deleteAcknowledged" :disabled="deleting" type="checkbox" class="mr-2" />선택한 기록과 날짜·보관 지침을 확인했고 영구 삭제에 동의합니다.</label>
      <Button variant="destructive" :disabled="!canDelete || deleting || pending" @click="deleteRecords">{{ deleting ? '삭제 중…' : '선택한 날짜 기록 영구 삭제' }}</Button>
      <p>삭제자·대상 기록 종류·날짜·사유·결과는 오늘의 관리자 감사 기록에 남습니다.</p>
    </div>
    <p v-if="deleteMessage" role="status" class="text-sm">{{ deleteMessage }}</p>
    <div v-if="kind === 'audit'" class="space-y-3 rounded-md border p-4 text-sm">
      <h2 class="font-semibold">월별 접속기록 점검 확인</h2>
      <p class="text-muted-foreground">선택한 달의 조회·변경·다운로드 등 기록을 검토하고 이상 여부와 다운로드 사유를 조직의 점검대장에 남긴 후 확인하세요. 이 버튼이 실제 점검이나 별도 조사를 대신하지 않습니다.</p>
      <label>점검 대상 월 (UTC)<input v-model="reviewMonth" type="month" class="ml-3 rounded border bg-background p-2" /></label>
      <label class="block"><input v-model="reviewed" type="checkbox" class="mr-2" />해당 월의 기록과 다운로드 사유를 점검했습니다.</label>
      <Button :disabled="!reviewed || reviewing" variant="outline" @click="confirmReview">점검 확인 기록</Button>
      <p v-if="reviewMessage" role="status">{{ reviewMessage }}</p>
    </div>
    <p class="text-xs leading-6 text-muted-foreground">CSV에는 연결 주소와 내부 회원 번호가 포함될 수 있습니다. 권한 있는 담당자에게 필요한 날짜만 제출하고 제출 목적·보관기간을 정해 안전하게 전달·폐기하세요. CSV 내려받기도 기록됩니다. 이 화면은 Nginx·시스템 로그 또는 독립된 외부 보관소를 대신하지 않습니다.</p>
  </section>
</template>

<script setup lang="ts">
import VisitStatistics from "./components/VisitStatistics.vue"

defineOptions({ name: "NuboSecurityLogs" })

type LogPage = { manualDeletionOnly?: boolean; fullIP?: boolean; integrityChecked?: boolean; items: { time: string; method: string; route: string; status: number; resultCode?: number; durationMs: number; actor: number; peer?: string; subjects?: number[]; phase?: string; reference?: string; purpose?: string }[]; next: number; retentionDays: number; maskedIP: boolean; writeError: boolean; dropped: number }
const purposeLabels: Record<string, string> = {
  "privacy-review": "개인정보 보호 점검", "incident-response": "보안 사고 대응", "authority-submission": "권한 있는 기관 제출",
  "retention-policy": "조직의 보관 정책에 따른 정리", "privacy-request": "개인정보 처리 요청 조치", "test-cleanup": "테스트 기록 정리",
}
const config = useRuntimeConfig()
const kind = ref("visits")
const exportPurpose = ref("privacy-review")
const endpoint = computed(() => `/admin/system/${kind.value}`)
const day = ref(new Date().toISOString().slice(0, 10))
const offset = ref(0)
const result = ref<LogPage>()
const pending = ref(false)
const downloading = ref(false)
const errorMessage = ref("")
let loadSequence = 0
onBeforeUnmount(() => { loadSequence++ })
async function load() {
  const sequence = ++loadSequence
  pending.value = true
  errorMessage.value = ""
  try {
    const data = await $fetch<LogPage>(endpoint.value, { baseURL: config.public.apiBase, query: { date: day.value, offset: offset.value } })
    if (!Array.isArray(data.items) || typeof data.retentionDays !== "number") throw new Error("Invalid log response")
    if (sequence === loadSequence) {
      result.value = data
      if (kind.value === "visits" || kind.value === "audit") manualKinds[kind.value] = data.manualDeletionOnly === true
    }
  }
  catch { if (sequence === loadSequence) { result.value = undefined; errorMessage.value = "로그를 불러오지 못했습니다. 관리자 권한과 백엔드 업데이트·저장소 상태를 확인해 주세요." } }
  finally { if (sequence === loadSequence) pending.value = false }
}
async function download() {
  const exportKind = kind.value
  const exportDay = day.value
  const exportEndpoint = endpoint.value
  downloading.value = true
  errorMessage.value = ""
  try {
    const response = await $fetch.raw<Blob>(exportEndpoint, { baseURL: config.public.apiBase, query: { date: exportDay, format: "csv", purpose: exportPurpose.value }, responseType: "blob" })
    if (!response.headers.get("content-type")?.startsWith("text/csv") || !response._data) throw new Error("Invalid export")
    const url = URL.createObjectURL(response._data)
    const link = document.createElement("a")
    link.href = url; link.download = `nubo-${exportKind}-${exportDay}.csv`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch { errorMessage.value = "CSV를 내려받지 못했습니다. 관리자 권한과 백엔드 상태를 확인해 주세요." }
  finally { downloading.value = false }
}
const deleting = ref(false)
const deleteReason = ref("retention-policy")
const deleteConfirmDate = ref("")
const deleteAcknowledged = ref(false)
const deleteMessage = ref("")
const manualKinds = reactive({ visits: false, audit: false })
const manualDeletionEnabled = computed(() => kind.value === "visits" ? manualKinds.visits : kind.value === "audit" ? manualKinds.audit : false)
const canDelete = computed(() => manualDeletionEnabled.value && /^\d{4}-\d{2}-\d{2}$/.test(day.value) && day.value < new Date().toISOString().slice(0, 10) && deleteConfirmDate.value === day.value && deleteAcknowledged.value)
watch([kind, day], () => { deleteConfirmDate.value = ""; deleteAcknowledged.value = false; deleteMessage.value = "" })
async function deleteRecords() {
  if (!canDelete.value || deleting.value) return
  const selectedDay = day.value
  const selectedKind = kind.value
  deleting.value = true; errorMessage.value = ""
  try {
    const response = await $fetch<{ success: boolean; deleted: boolean }>(`/admin/system/records/${selectedKind}`, {
      baseURL: config.public.apiBase, method: "DELETE", retry: 0,
      query: { date: selectedDay }, body: { confirmDate: deleteConfirmDate.value, reason: deleteReason.value },
    })
    if (!response.success) throw new Error("Deletion failed")
    deleteMessage.value = response.deleted ? `${selectedDay} (UTC)의 기록을 삭제했습니다.` : "해당 날짜에 삭제할 기록이 없습니다."
    deleteConfirmDate.value = ""; deleteAcknowledged.value = false; offset.value = 0
    await load()
    statisticsRevision.value++
  } catch { deleteConfirmDate.value = ""; deleteAcknowledged.value = false; errorMessage.value = "삭제 결과를 확인하지 못했습니다. 자동 재시도하지 않았습니다. 기록을 다시 조회하고 관리자 감사와 저장소 상태를 확인해 주세요." }
  finally { deleting.value = false }
}
const statisticsRevision = ref(0)
const reviewMonth = ref(new Date().toISOString().slice(0, 7))
const reviewed = ref(false)
const reviewing = ref(false)
const reviewMessage = ref("")
async function confirmReview() {
  reviewing.value = true
  try {
    const response = await $fetch<{ success: boolean }>("/admin/system/audit-review", { baseURL: config.public.apiBase, method: "POST", query: { month: reviewMonth.value } })
    if (!response.success) throw new Error("Review not recorded")
    reviewMessage.value = "점검 확인을 기록했습니다."; reviewed.value = false; await load()
  } catch { errorMessage.value = "점검 확인을 기록하지 못했습니다." }
  finally { reviewing.value = false }
}
onMounted(async () => {
  void load()
  try {
    // Keep explicit deletion available for a past audit day whose interrupted deletion prevents reading it.
    const status = await $fetch<{ available: boolean; visitLogManualDeletionOnly?: boolean; auditLogManualDeletionOnly?: boolean }>("/legal/status", { baseURL: config.public.apiBase })
    if (status.available) {
      manualKinds.visits = status.visitLogManualDeletionOnly === true
      manualKinds.audit = status.auditLogManualDeletionOnly === true
    }
  } catch { /* A successful log response also supplies the retention mode. */ }
})
</script>
