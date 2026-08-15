<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 auto-rows-[minmax(180px,auto)] p-6">
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
import { Calendar1Icon, HeartIcon, MessageCircleIcon, User2Icon } from "lucide-vue-next"
import { useNuboAdminContext } from "~/providers/contexts/admin"
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
const maxVisit = computed(() => {
  const visits = statVisit.value.history.map((h) => h.visit)
  return Math.max(...visits)
})

onMounted(async () => {
  try {
    await Promise.all([loadInitReportList(false, 3), loadInitCommentList(5), loadInitPostList(5)])
    if (statVisit.value.history.length < 1) {
      isLoading.value = true
      await loadInitDashboard(90, 5)
    }
  } finally {
    isLoading.value = false
  }
})
</script>
