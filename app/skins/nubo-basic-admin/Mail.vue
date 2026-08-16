<template>
  <div>
    <header class="hidden h-16 items-center justify-between border-b bg-card p-4 md:flex">
      <div class="flex items-center gap-3">
        <MailIcon class="size-5" />
        <h2 class="text-xl font-bold">단체 메일</h2>
      </div>
      <span class="text-xs text-muted-foreground">Markdown으로 작성하고 실제 메일 형태를 확인하세요</span>
    </header>

    <div class="space-y-5 p-4 sm:p-6">
      <div
        v-if="mailStatusLoaded && !mailStatus.configured"
        class="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
      >
        <p class="font-semibold">Resend 설정을 먼저 완료해야 합니다</p>
        <p class="mt-1 leading-6 text-muted-foreground">
          API 키와 인증된 도메인의 발신 주소를 설정한 뒤 GOAPI를 재시작하세요. 설정 전에는 저장과
          미리보기만 사용할 수 있습니다.
        </p>
      </div>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div class="space-y-5">
          <Card>
            <CardHeader class="border-b">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{{ campaign.uid ? `메일 #${campaign.uid}` : "새 단체 메일" }}</CardTitle>
                  <CardDescription class="mt-1">발송된 메일은 수정하거나 다시 발송할 수 없습니다.</CardDescription>
                </div>
                <Badge :variant="statusVariant">{{ statusLabel }}</Badge>
              </div>
            </CardHeader>
            <CardContent class="space-y-4 pt-6">
              <div class="space-y-2">
                <label for="mail-subject" class="text-sm font-medium">제목</label>
                <Input
                  id="mail-subject"
                  v-model="campaign.subject"
                  maxlength="200"
                  placeholder="회원에게 전달할 메일 제목"
                  :disabled="isLocked"
                />
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-3">
                  <label for="mail-content" class="text-sm font-medium">본문</label>
                  <span class="text-xs text-muted-foreground">Markdown · 최대 200KB</span>
                </div>
                <Textarea
                  id="mail-content"
                  v-model="campaign.markdown"
                  class="min-h-80 resize-y font-mono text-sm leading-6"
                  placeholder="# 안녕하세요&#10;&#10;회원 여러분께 전할 내용을 작성하세요."
                  :disabled="isLocked"
                />
              </div>

              <div v-if="campaign.lastError" class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {{ campaign.lastError }}
              </div>

              <div class="flex flex-wrap items-center gap-3 border-t pt-5">
                <Button variant="outline" :disabled="busy || isLocked" @click="saveCampaign">
                  <SaveIcon class="size-4" /> 초안 저장
                </Button>

                <label class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm" :class="isSent && 'cursor-not-allowed opacity-60'">
                  <Checkbox v-model="sendToAll" :disabled="isSent" />
                  전체 회원 대상
                </label>

                <Button
                  v-if="!sendToAll"
                  :disabled="busy || !mailStatus.configured || isSent"
                  @click="sendTest"
                >
                  <SendIcon class="size-4" /> 관리자에게 테스트 발송
                </Button>

                <Button
                  v-else-if="campaign.status === 'draft' || campaign.status === 'failed'"
                  :disabled="busy || !mailStatus.configured"
                  @click="prepareRecipients"
                >
                  <UsersIcon class="size-4" /> 전체 회원 {{ campaign.status === "failed" ? "다시 " : "" }}준비
                </Button>

                <Button v-else-if="campaign.status === 'syncing'" disabled>
                  <LoaderCircleIcon class="size-4 animate-spin" /> 수신자 동기화 중
                </Button>

                <Button v-else-if="campaign.status === 'sending'" disabled>
                  <LoaderCircleIcon class="size-4 animate-spin" /> Resend 발송 요청 중
                </Button>

                <AlertDialog v-else-if="campaign.status === 'ready'">
                  <AlertDialogTrigger as-child>
                    <Button variant="destructive" :disabled="busy || !mailStatus.configured">
                      <SendIcon class="size-4" /> {{ campaign.recipientCount.toLocaleString() }}명에게 발송
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>전체 회원에게 단체 메일을 발송할까요?</AlertDialogTitle>
                      <AlertDialogDescription>
                        현재 활성 회원 {{ campaign.recipientCount.toLocaleString() }}명이 대상입니다. 발송을
                        시작하면 취소하거나 본문을 수정할 수 없습니다. 관리자 테스트 메일을 먼저 확인했는지
                        다시 확인하세요.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>돌아가기</AlertDialogCancel>
                      <AlertDialogAction @click="sendBroadcast">확인하고 발송</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <span v-if="!sendToAll" class="text-xs text-muted-foreground">
                  기본값은 관리자 계정 이메일 한 명에게만 발송됩니다.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="border-b">
              <CardTitle class="text-base">메일 미리보기</CardTitle>
              <CardDescription>서버에서 정화한 Markdown을 실제 발송 템플릿으로 표시합니다.</CardDescription>
            </CardHeader>
            <CardContent class="p-0">
              <div v-if="previewLoading" class="flex h-96 items-center justify-center text-muted-foreground">
                <LoaderCircleIcon class="size-5 animate-spin" />
              </div>
              <iframe
                v-else-if="previewHTML"
                title="단체 메일 미리보기"
                :srcdoc="previewHTML"
                sandbox=""
                class="h-[720px] w-full rounded-b-xl bg-white"
              ></iframe>
              <div v-else class="flex h-96 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                제목과 본문을 입력하면 여기에 미리보기가 표시됩니다.
              </div>
            </CardContent>
          </Card>
        </div>

        <aside class="space-y-4">
          <Card>
            <CardHeader class="flex-row items-center justify-between gap-3 border-b">
              <div>
                <CardTitle class="text-base">최근 메일</CardTitle>
                <CardDescription>총 {{ campaignTotal.toLocaleString() }}개</CardDescription>
              </div>
              <Button size="sm" variant="outline" @click="newCampaign"><PlusIcon class="size-4" /> 새 메일</Button>
            </CardHeader>
            <CardContent class="p-0">
              <button
                v-for="item in campaigns"
                :key="item.uid"
                type="button"
                class="block w-full border-b p-4 text-left transition-colors last:border-b-0 hover:bg-muted/50"
                :class="campaign.uid === item.uid && 'bg-muted'"
                @click="selectCampaign(item.uid)"
              >
                <span class="line-clamp-2 text-sm font-medium">{{ item.subject }}</span>
                <span class="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{{ formatTimestamp(item.updated) }}</span>
                  <Badge variant="outline">{{ campaignStatusLabels[item.status] }}</Badge>
                </span>
              </button>
              <p v-if="campaigns.length === 0" class="p-6 text-center text-sm text-muted-foreground">
                저장된 단체 메일이 없습니다.
              </p>
            </CardContent>
          </Card>

          <div class="rounded-xl border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            <p class="font-semibold text-foreground">무료 티어 기준</p>
            <p class="mt-1">Resend Marketing 무료 플랜은 연락처 {{ mailStatus.freeMarketingContacts.toLocaleString() }}명까지 지원합니다.</p>
            <p class="mt-2">차단된 회원과 올바르지 않은 이메일 주소는 동기화 대상에서 제외됩니다.</p>
            <p class="mt-2">수신 거부 링크는 전체 발송 메일 하단에 자동으로 포함됩니다.</p>
            <p class="mt-2">광고성 내용을 보낼 때에는 운영 지역의 수신 동의와 표시 의무를 확인하세요.</p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LoaderCircleIcon,
  MailIcon,
  PlusIcon,
  SaveIcon,
  SendIcon,
  UsersIcon,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import type {
  AdminMailCampaign,
  AdminMailCampaignStatus,
  AdminMailStatus,
} from "~/types/admin"

defineOptions({ name: "NuboAdminMail" })

const emptyCampaign = (): AdminMailCampaign => ({
  uid: 0,
  subject: "",
  markdown: "",
  status: "draft",
  recipientCount: 0,
  resendBroadcastId: "",
  lastError: "",
  created: 0,
  updated: 0,
  sent: 0,
})

const campaignStatusLabels: Record<AdminMailCampaignStatus, string> = {
  draft: "초안",
  syncing: "수신자 준비 중",
  ready: "발송 준비 완료",
  sending: "발송 요청 중",
  sent: "발송됨",
  failed: "준비 실패",
}
const campaign = reactive<AdminMailCampaign>(emptyCampaign())
const campaigns = ref<AdminMailCampaign[]>([])
const campaignTotal = ref(0)
const mailStatusLoaded = ref(false)
const mailStatus = ref<AdminMailStatus>({
  configured: false,
  provider: "resend",
  from: "",
  replyTo: "",
  domainStatus: "not_configured",
  freeDaily: 100,
  freeMonthly: 3000,
  freeMarketingContacts: 1000,
})
const sendToAll = ref(false)
const busy = ref(false)
const previewLoading = ref(false)
const previewHTML = ref("")
let previewTimer: ReturnType<typeof setTimeout> | undefined
let syncTimer: ReturnType<typeof setTimeout> | undefined

const {
  loadMailCampaign,
  loadMailCampaigns,
  loadMailStatus,
  prepareMailCampaign,
  previewMailCampaign,
  saveMailCampaign: saveCampaignRequest,
  sendMailCampaign,
  sendMailCampaignTest,
} = useAdmin()

const isSent = computed(() => campaign.status === "sent")
const isLocked = computed(() => isSent.value || campaign.resendBroadcastId !== "")
const statusLabel = computed(() => campaignStatusLabels[campaign.status])
const statusVariant = computed(() => {
  if (campaign.status === "sent") return "default"
  if (campaign.status === "failed") return "destructive"
  return "secondary"
})

const applyCampaign = (value: AdminMailCampaign) => Object.assign(campaign, value)

const refreshCampaigns = async () => {
  const response = await loadMailCampaigns()
  if (response.success && response.result) {
    campaigns.value = response.result.items
    campaignTotal.value = response.result.total
  }
}

const renderPreview = async () => {
  if (campaign.subject.trim().length < 2 || campaign.markdown.trim().length < 2) {
    previewHTML.value = ""
    return
  }
  previewLoading.value = true
  try {
    const response = await previewMailCampaign(campaign.subject, campaign.markdown)
    previewHTML.value = response.success && response.result ? response.result.html : ""
  } catch {
    previewHTML.value = ""
  } finally {
    previewLoading.value = false
  }
}

watch(
  () => [campaign.subject, campaign.markdown],
  () => {
    clearTimeout(previewTimer)
    previewTimer = setTimeout(renderPreview, 450)
  },
)

const saveCampaign = async () => {
  busy.value = true
  try {
    const response = await saveCampaignRequest({
      uid: campaign.uid,
      subject: campaign.subject,
      markdown: campaign.markdown,
    })
    if (!response.success || !response.result) throw new Error(response.error || "저장 실패")
    applyCampaign(response.result)
    await refreshCampaigns()
    toast("✅ 단체 메일 초안을 저장했습니다")
    return true
  } catch (error) {
    toast(`❌ 단체 메일을 저장하지 못했습니다: ${error}`)
    return false
  } finally {
    busy.value = false
  }
}

const ensureSaved = async () => saveCampaign()

const sendTest = async () => {
  if (!(await ensureSaved())) return
  busy.value = true
  try {
    const response = await sendMailCampaignTest(campaign.uid)
    if (!response.success) throw new Error(response.error || "테스트 발송 실패")
    toast("✅ 관리자 계정 이메일로 테스트 메일을 보냈습니다")
  } catch (error) {
    toast(`❌ 테스트 메일을 보내지 못했습니다: ${error}`)
  } finally {
    busy.value = false
  }
}

const pollSyncStatus = async () => {
  clearTimeout(syncTimer)
  if (!campaign.uid || campaign.status !== "syncing") return
  try {
    const response = await loadMailCampaign(campaign.uid)
    if (response.success && response.result) {
      applyCampaign(response.result)
      await refreshCampaigns()
    }
  } catch {
    // 다음 폴링에서 다시 확인합니다.
  }
  if (campaign.status === "syncing") syncTimer = setTimeout(pollSyncStatus, 2500)
}

const prepareRecipients = async () => {
  if (!(await ensureSaved())) return
  busy.value = true
  try {
    const response = await prepareMailCampaign(campaign.uid)
    if (!response.success || !response.result) throw new Error(response.error || "수신자 준비 실패")
    applyCampaign(response.result)
    await refreshCampaigns()
    toast("✅ Resend에서 전체 회원 수신자 동기화를 시작했습니다")
    pollSyncStatus()
  } catch (error) {
    toast(`❌ 전체 회원을 준비하지 못했습니다: ${error}`)
  } finally {
    busy.value = false
  }
}

const sendBroadcast = async () => {
  if (!campaign.resendBroadcastId && !(await ensureSaved())) return
  busy.value = true
  try {
    const response = await sendMailCampaign(campaign.uid)
    if (!response.success || !response.result) throw new Error(response.error || "전체 발송 실패")
    applyCampaign(response.result)
    await refreshCampaigns()
    toast("✅ 전체 회원 단체 메일 발송을 요청했습니다")
  } catch (error) {
    toast(`❌ 단체 메일을 발송하지 못했습니다: ${error}`)
  } finally {
    busy.value = false
  }
}

const selectCampaign = async (uid: number) => {
  clearTimeout(syncTimer)
  const response = await loadMailCampaign(uid)
  if (!response.success || !response.result) {
    toast(`❌ 단체 메일을 불러오지 못했습니다: ${response.error}`)
    return
  }
  applyCampaign(response.result)
  sendToAll.value = false
  renderPreview()
  if (campaign.status === "syncing") pollSyncStatus()
}

const newCampaign = () => {
  clearTimeout(syncTimer)
  applyCampaign(emptyCampaign())
  sendToAll.value = false
  previewHTML.value = ""
}

const formatTimestamp = (value: number) => value ? new Date(value).toLocaleString("ko-KR") : "-"

onMounted(async () => {
  const [status] = await Promise.all([loadMailStatus().catch(() => null), refreshCampaigns()])
  if (status?.success && status.result) mailStatus.value = status.result
  mailStatusLoaded.value = true
})

onBeforeUnmount(() => {
  clearTimeout(previewTimer)
  clearTimeout(syncTimer)
})
</script>
