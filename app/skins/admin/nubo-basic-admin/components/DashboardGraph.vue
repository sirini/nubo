<template>
  <Card>
    <CardHeader class="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
      <div class="flex flex-1 flex-col justify-center px-6 py-2">
        <CardTitle>사이트 활동 추이</CardTitle>
        <CardDescription class="pt-2">
          기간에 따라 게시글/댓글 및 방문자수 추이를 자세히 살펴보세요
        </CardDescription>

        <div class="flex flex-row rounded-lg overflow-hidden border mt-4">
          <div
            v-for="(config, key) in chartConfig"
            :key="key"
            :data-active="activeMetrics[key]"
            class="flex flex-1 flex-col items-center justify-center p-2 text-left data-[active=true]:bg-muted/30 cursor-pointer"
            @click="activeMetrics[key] = !activeMetrics[key]"
          >
            <span class="text-sm text-muted-foreground data-[active=true]:font-bold">{{
              config.label
            }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center px-6 sm:py-0">
        <Select v-model="timeRange">
          <SelectTrigger class="w-32 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="90d">90일</SelectItem>
            <SelectItem value="30d">30일</SelectItem>
            <SelectItem value="7d">7일</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardHeader>

    <CardContent class="p-4">
      <ChartContainer :config="chartConfig" class="aspect-auto h-72 w-full">
        <svg style="width: 0; height: 0; position: absolute">
          <defs>
            <linearGradient id="fillVisit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" :stop-color="chartConfig.visit.color" stop-opacity="0.3" />
              <stop offset="95%" :stop-color="chartConfig.visit.color" stop-opacity="0" />
            </linearGradient>

            <linearGradient id="fillPost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" :stop-color="chartConfig.post.color" stop-opacity="0.3" />
              <stop offset="95%" :stop-color="chartConfig.post.color" stop-opacity="0" />
            </linearGradient>

            <linearGradient id="fillComment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" :stop-color="chartConfig.comment.color" stop-opacity="0.3" />
              <stop offset="95%" :stop-color="chartConfig.comment.color" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <VisXYContainer :data="filterRange" :y-domain="[0, yMax]" :margin="{ left: 0, right: 0 }">
          <VisArea
            v-if="activeMetrics.visit"
            :x="(d: any) => d.date"
            :y="(d: any) => d.visit"
            color="url(#fillVisit)"
          />
          <VisLine
            v-if="activeMetrics.visit"
            :x="(d: any) => d.date"
            :y="(d: any) => d.visit"
            :color="chartConfig.visit.color"
            :line-width="2"
          />

          <VisArea
            v-if="activeMetrics.post"
            :x="(d: any) => d.date"
            :y="(d: any) => d.post"
            color="url(#fillPost)"
          />
          <VisLine
            v-if="activeMetrics.post"
            :x="(d: any) => d.date"
            :y="(d: any) => d.post"
            :color="chartConfig.post.color"
            :line-width="2"
          />

          <VisArea
            v-if="activeMetrics.comment"
            :x="(d: any) => d.date"
            :y="(d: any) => d.comment"
            color="url(#fillComment)"
          />
          <VisLine
            v-if="activeMetrics.comment"
            :x="(d: any) => d.date"
            :y="(d: any) => d.comment"
            :color="chartConfig.comment.color"
            :line-width="2"
          />

          <VisAxis
            type="x"
            :x="(d: any) => d.date"
            :tick-format="(d: number) => date(d).split('-').slice(1).join('/')"
            :num-ticks="7"
            :tick-line="false"
            :domain-line="false"
          />
          <VisAxis type="y" :num-ticks="5" :tick-line="false" :domain-line="false" />

          <ChartTooltip />
          <ChartCrosshair
            :template="
              componentToString(chartConfig, ChartTooltipContent, {
                labelFormatter: (d) => {
                  if (typeof d === 'number') {
                    return date(d)
                  } else {
                    return date(d.getTime())
                  }
                },
              })
            "
          />
        </VisXYContainer>
        <ChartLegendContent class="mt-4" />
      </ChartContainer>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartCrosshair,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue"
import { useNuboAdminContext } from "~/types/nubo-skin-keys"

const { statPost, statReply, statVisit } = useNuboAdminContext()

// 활성화된 지표 상태 관리
const activeMetrics = ref({
  visit: false,
  post: true,
  comment: true,
})

// 차트 설정 (Config)
const chartConfig = {
  visit: { label: "방문자", color: "var(--chart-3)" },
  comment: { label: "댓글", color: "var(--chart-2)" },
  post: { label: "게시글", color: "var(--chart-1)" },
}

// 상단 헤더에 표시할 합계 데이터
const totalCounts = computed(() => ({
  visit: statVisit.value?.total || 0,
  post: statPost.value?.total || 0,
  comment: statReply.value?.total || 0,
}))

// 백엔드 데이터를 차트용 포맷으로 변환
const nuboData = computed(() => {
  const visitHist = statVisit.value?.history || []
  const postHist = statPost.value?.history || []
  const replyHist = statReply.value?.history || []

  if (visitHist.length === 0) return []

  const combined = visitHist.map((v, i) => ({
    date: new Date(v.date),
    visit: v.visit || 0,
    post: postHist[i]?.visit || 0,
    comment: replyHist[i]?.visit || 0,
  }))

  // 과거 -> 현재 순으로 정렬
  return combined.sort((a, b) => a.date.getTime() - b.date.getTime())
})

// 기간 필터링 로직 (오늘 기준)
const timeRange = ref("90d")
const filterRange = computed(() => {
  if (nuboData.value.length === 0) return []

  const now = new Date()
  let days = 90
  if (timeRange.value === "30d") days = 30
  else if (timeRange.value === "7d") days = 7

  const startDate = new Date()
  startDate.setDate(now.getDate() - days)
  return nuboData.value.filter((item) => item.date >= startDate)
})

// 동적 Y축 최대값 계산
const yMax = computed(() => {
  if (filterRange.value.length === 0) return 10

  const activeValues: number[] = []
  filterRange.value.forEach((d) => {
    if (activeMetrics.value.visit) activeValues.push(d.visit)
    if (activeMetrics.value.post) activeValues.push(d.post)
    if (activeMetrics.value.comment) activeValues.push(d.comment)
  })

  const max = activeValues.length > 0 ? Math.max(...activeValues) : 10
  return max + max * 0.2
})

// SVG 그라데이션 정의
const svgDefs = `
  <linearGradient id="fillVisit" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--chart-3)" stop-opacity="0.3"/>
    <stop offset="95%" stop-color="var(--chart-3)" stop-opacity="0"/>
  </linearGradient>
`
</script>
