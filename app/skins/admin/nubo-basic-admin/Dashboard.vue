<template>
  <div class="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
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
            <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">replys</p>
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
              history.visit === maxVisit ? 'bg-primary' : 'bg-primary/20 group-hover:bg-primary/40'
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
      <Skeleton class="w-full h-full rounded-xl" v-if="isLoading" />
      <DashboardGraph v-else :statPost="statPost" :statReply="statReply" :statVisit="statVisit" />
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
        </div>
      </div>
    </Card>

    <Card class="md:col-span-4 p-6">
      <CardTitle class="text-sm font-medium mb-4">미결 신고 사항</CardTitle>
      <div class="space-y-4">
        <div
          v-for="i in 2"
          :key="i"
          class="flex gap-3 text-sm border-b pb-3 last:border-0 last:pb-0"
        >
          <Badge variant="destructive" class="h-5">신고</Badge>
          <div class="flex-1 truncate">
            <p class="font-medium truncate">부적절한 게시글 제목...</p>
            <p class="text-xs text-muted-foreground">2분 전</p>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useNuboAdminContext } from "~/types/nubo-skin-keys"
import DashboardGraph from "./components/DashboardGraph.vue"

const { user, statPost, statReply, statVisit, statFile, statUploadUsage, loadInitDashboard } =
  useNuboAdminContext()
const isLoading = ref<boolean>(false)
const maxVisit = computed(() => {
  const visits = statVisit.value.history.map((h) => h.visit)
  return Math.max(...visits)
})

onMounted(async () => {
  try {
    if (statVisit.value.history.length < 1) {
      isLoading.value = true
      await loadInitDashboard(90, 5, 5)
    }
  } finally {
    isLoading.value = false
  }
})
</script>
