<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 auto-rows-[minmax(180px,auto)] p-6">
      <div
        v-if="mailStatusLoaded && !mailStatus.configured"
        class="md:col-span-12 flex flex-col gap-4 rounded-xl border border-primary/25 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between"
        role="status"
      >
        <div class="flex gap-3">
          <MailWarningIcon class="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p class="font-semibold">Resend 이메일 발송 설정이 필요합니다</p>
            <p class="mt-1 text-sm leading-6 text-muted-foreground">
              <code>RESEND_API_KEY</code>와 발신 주소를 설정하면 회원가입 인증, 비밀번호 재설정,
              댓글 알림을 사용할 수 있습니다. 무료 티어는 하루 {{ mailStatus.freeDaily }}건·월
              {{ mailStatus.freeMonthly.toLocaleString() }}건의 트랜잭션 메일을 지원합니다.
            </p>
          </div>
        </div>
        <Button variant="outline" as-child class="shrink-0">
          <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer">
            무료로 시작하기
            <ExternalLinkIcon class="size-4" />
          </a>
        </Button>
      </div>
      <div
        v-else-if="mailStatusLoaded && !isMailDomainReady"
        class="md:col-span-12 flex flex-col gap-4 rounded-xl border border-warning/30 bg-warning/10 p-5 sm:flex-row sm:items-center sm:justify-between"
        role="status"
      >
        <div class="flex gap-3">
          <MailWarningIcon class="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p class="font-semibold">Resend 발신 도메인 확인이 필요합니다</p>
            <p class="mt-1 text-sm leading-6 text-muted-foreground">
              API 키는 설정되었지만 <code>{{ mailStatus.from }}</code> 발신 도메인의 상태가
              <strong>{{ mailStatus.domainStatus }}</strong>입니다. Resend에서 DNS 레코드를 확인한 뒤
              도메인을 다시 검증해 주세요.
            </p>
          </div>
        </div>
        <Button variant="outline" as-child class="shrink-0">
          <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer">
            도메인 설정 열기
            <ExternalLinkIcon class="size-4" />
          </a>
        </Button>
      </div>
      <Card
        class="md:col-span-8 flex flex-col justify-between p-8 bg-linear-to-br from-primary/5 via-transparent to-transparent"
      >
        <div class="space-y-2">
          <h3 class="text-2xl font-bold tracking-tight">
            안녕하세요, {{ recoverChars(user.name) }} 님! 👋
          </h3>
          <p class="text-muted-foreground">
            현재 NUBO 시스템은 <span class="text-green-500 font-semibold">정상 운영</span> 중입니다.
          </p>
        </div>
        <div class="flex gap-8 mt-6">
          <CommonVTooltip content="지금까지 작성된 총 게시글 개수 (삭제 포함)">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">posts</p>
              <p class="text-xl font-mono font-bold">{{ statPost.total }}</p>
            </div>
          </CommonVTooltip>
          <CommonVTooltip content="지금까지 작성된 총 댓글 개수 (삭제 포함)">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">comments</p>
              <p class="text-xl font-mono font-bold">{{ statReply.total }}</p>
            </div>
          </CommonVTooltip>
          <CommonVTooltip content="지금까지 총 방문자수">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">visits</p>
              <p class="text-xl font-mono font-bold">{{ num(statVisit.total) }}</p>
            </div>
          </CommonVTooltip>
        </div>
      </Card>

      <Card class="md:col-span-4 p-6 overflow-hidden">
        <CardHeader class="p-0 mb-4">
          <CardTitle class="text-sm font-bold tracking-widest text-muted-foreground"
            >일주일간 방문자 현황</CardTitle
          >
        </CardHeader>

        <div class="flex items-end gap-4 mb-2">
          <span class="text-4xl font-black tracking-tighter text-primary">
            {{ statVisit.history[0]?.visit?.toLocaleString() || 0 }}
          </span>
          <span class="text-[11px] mb-2 font-semibold text-muted-foreground uppercase">
            Today / {{ date(statVisit.history[0]?.date || Date.now()) }}
          </span>
        </div>

        <div class="h-24 flex items-end gap-1.5">
          <div
            v-for="(history, index) in statVisit.history.slice(0, 7)"
            :key="index"
            class="flex flex-1 flex-col justify-end items-center group relative h-full"
          >
            <div
              class="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap"
            >
              {{ history.visit }}명
            </div>

            <div
              class="w-full transition-all duration-300 rounded-t-[2px]"
              :class="
                history.visit === maxVisit
                  ? 'bg-primary'
                  : 'bg-primary/20 group-hover:bg-primary/40'
              "
              :style="{ height: maxVisit > 0 ? `${(history.visit / maxVisit) * 100}%` : '2%' }"
            ></div>

            <span
              class="mt-2 text-[9px] font-medium text-muted-foreground uppercase tracking-tighter scale-90 origin-top"
            >
              {{ date(history.date).split("-").slice(1).join("/") }}
            </span>
          </div>
        </div>
      </Card>

      <div class="md:col-span-8 md:row-span-2 flex flex-col">
        <Skeleton v-if="isLoading" class="w-full h-full rounded-xl" />
        <DashboardGraph v-else :stat-post="statPost" :stat-reply="statReply" :stat-visit="statVisit" />
      </div>

      <Card class="md:col-span-4 p-6">
        <CardTitle class="text-sm font-medium mb-4 text-muted-foreground">서버 리소스</CardTitle>
        <div class="space-y-6">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="font-mono uppercase">Disk Usage</span>
              <span class="font-mono font-bold">{{ num(statUploadUsage) }}B</span>
            </div>

            <div class="flex justify-between text-sm">
              <span class="font-mono uppercase">files</span>
              <span class="font-mono font-bold">{{ num(statFile.total) }}</span>
            </div>

            <div class="flex justify-between text-sm">
              <span class="font-mono uppercase">images</span>
              <span class="font-mono font-bold">{{ num(statImage.total) }}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card class="md:col-span-4 p-6">
        <CardTitle class="text-sm font-medium mb-4 text-muted-foreground">미결 신고 사항</CardTitle>
        <div class="space-y-4">
          <div
            v-for="(report, index) in latestReports"
            :key="index"
            class="flex gap-3 text-sm border-b pb-3 last:border-0 last:pb-0"
          >
            <Badge variant="destructive" class="h-5">신고</Badge>
            <div class="flex-1 truncate space-y-2">
              <p class="font-medium truncate">{{ report.request }}</p>
              <p class="text-xs text-muted-foreground">{{ date(report.date) }}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card class="md:col-span-6 p-6">
        <CardTitle class="text-sm font-medium mb-4 text-muted-foreground">최근 댓글</CardTitle>
        <div class="space-y-4">
          <div
            v-for="(comment, index) in latestComments"
            :key="index"
            class="flex gap-3 text-sm border-b pb-3 last:border-0 last:pb-0"
          >
            <Badge variant="secondary" class="h-6">{{ comment.name }}</Badge>
            <div class="flex-1 truncate">
              <NuxtLink
                :to="`/board/${comment.id}/${comment.postUid}`"
                class="hover:text-primary transition-colors duration-300"
              >
                <p class="font-medium truncate">{{ recoverChars(stripTags(comment.content)) }}</p>
              </NuxtLink>
              <p class="text-xs text-muted-foreground flex items-center gap-4 mt-1.5">
                <span class="inline-flex items-center gap-1.5"
                  ><User2Icon class="w-3 h-3" /> {{ recoverChars(comment.writer.name) }}</span
                >
                <span class="inline-flex items-center gap-1.5"
                  ><Calendar1Icon class="w-3 h-3" /> {{ date(comment.date) }}</span
                >
                <span class="inline-flex items-center gap-1.5"
                  ><HeartIcon class="w-3 h-3" /> {{ num(comment.like) }}</span
                >
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card class="md:col-span-6 p-6">
        <CardTitle class="text-sm font-medium mb-4 text-muted-foreground">최근 게시글</CardTitle>
        <div class="space-y-4">
          <div
            v-for="(post, index) in latestPosts"
            :key="index"
            class="flex gap-3 text-sm border-b pb-3 last:border-0 last:pb-0"
          >
            <Badge variant="secondary" class="h-6">{{ post.name }}</Badge>
            <div class="flex-1 truncate">
              <NuxtLink
                :to="`/board/${post.id}/${post.uid}`"
                class="hover:text-primary transition-colors duration-300"
              >
                <p class="font-medium truncate">{{ recoverChars(stripTags(post.title)) }}</p>
              </NuxtLink>
              <p class="text-xs text-muted-foreground flex items-center gap-4 mt-1.5">
                <span class="inline-flex items-center gap-2"
                  ><User2Icon class="w-3 h-3" /> {{ recoverChars(post.writer.name) }}</span
                >
                <span class="inline-flex items-center gap-1.5"
                  ><Calendar1Icon class="w-3 h-3" /> {{ date(post.date) }}</span
                >
                <span class="inline-flex items-center gap-1.5"
                  ><HeartIcon class="w-3 h-3" /> {{ num(post.like) }}</span
                >
                <span class="inline-flex items-center gap-1.5">
                  <MessageCircleIcon class="w-3 h-3" /> {{ num(post.comment) }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Calendar1Icon,
  ExternalLinkIcon,
  HeartIcon,
  MailWarningIcon,
  MessageCircleIcon,
  User2Icon,
} from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"
import type { AdminMailStatus } from "~/types/admin"
import DashboardGraph from "./components/DashboardGraph.vue"

defineOptions({ name: "NuboAdminDashboard" })

const {
  user,
  statPost,
  statReply,
  statVisit,
  statFile,
  statImage,
  statUploadUsage,
  latestReports,
  latestComments,
  latestPosts,
  loadInitDashboard,
  loadInitReportList,
  loadInitCommentList,
  loadInitPostList,
} = useNuboAdminContext()
const isLoading = ref<boolean>(false)
const mailStatusLoaded = ref(false)
const mailStatus = ref<AdminMailStatus>({
  configured: false,
  provider: "resend",
  from: "",
  domainStatus: "not_configured",
  freeDaily: 100,
  freeMonthly: 3000,
})
const { loadMailStatus } = useAdmin()
const isMailDomainReady = computed(() =>
  ["verified", "unknown"].includes(mailStatus.value.domainStatus),
)
const maxVisit = computed(() => {
  const visits = statVisit.value.history.map((h) => h.visit)
  return Math.max(...visits)
})

onMounted(async () => {
  try {
    const [, , , statusResponse] = await Promise.all([
      loadInitReportList(false, 3),
      loadInitCommentList(5),
      loadInitPostList(5),
      loadMailStatus().catch(() => null),
    ])
    if (statusResponse?.success && statusResponse.result) {
      mailStatus.value = statusResponse.result
      mailStatusLoaded.value = true
    }
    if (statVisit.value.history.length < 1) {
      isLoading.value = true
      await loadInitDashboard(90, 5)
    }
  } finally {
    isLoading.value = false
  }
})
</script>
