<template>
  <section class="relative">
    <div class="mx-auto max-w-5xl px-6 py-20 sm:py-32">
      <div data-reveal class="text-center mb-16">
        <Badge
          variant="outline"
          class="mb-5 border-white/10 bg-white/3 text-slate-300 backdrop-blur-sm"
        >
          <ZapIcon class="w-3 h-3 mr-1.5 text-amber-400" />
          What's New
        </Badge>
        <h2 class="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          <span class="text-slate-100/10 font-light">TSBOARD</span>
          <span class="text-slate-500 mx-3">→</span>
          <span
            class="bg-linear-to-r from-indigo-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent font-black"
          >
            NUBO
          </span>
        </h2>
        <p class="mx-auto max-w-xl text-sm sm:text-base text-slate-400">
          렌더링 · DB · UI · 확장성까지 네 영역을 전면 개편했습니다
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          v-for="(feature, i) in features"
          :key="feature.title"
          data-reveal
          class="group relative overflow-hidden rounded-2xl border-white/8 bg-white/2 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/4"
          :style="{ animationDelay: `${i * 100}ms` }"
        >
          <CardContent class="relative">
            <div class="flex items-start gap-5">
              <div
                :class="[
                  'shrink-0 grid place-items-center h-12 w-12 rounded-xl bg-linear-to-br ring-1 ring-white/10 shadow-lg',
                  feature.accent,
                  feature.shadow,
                ]"
              >
                <component :is="feature.icon" class="w-5 h-5 text-white" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                  <h3 class="text-lg font-semibold text-slate-100">
                    {{ feature.title }}
                  </h3>
                  <span class="text-[11px] text-slate-500 font-mono tracking-wider">
                    {{ feature.tag }}
                  </span>
                </div>
                <p class="text-sm text-slate-400 leading-relaxed">
                  {{ feature.description }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { DatabaseIcon, GlobeIcon, LayersIcon, PaletteIcon, ZapIcon } from "lucide-vue-next"

const features = [
  {
    icon: GlobeIcon,
    title: "SSR 렌더링",
    tag: "Server Side Rendering",
    description: "주요 페이지를 서버에서 렌더링해 Google · AI 검색 엔진이 더 쉽게 내용을 찾습니다",
    accent: "from-sky-500 to-cyan-400",
    shadow: "shadow-cyan-500/25",
  },
  {
    icon: DatabaseIcon,
    title: "효율적인 쿼리",
    tag: "Deferred Join",
    description:
      "지연 조인(deferred join) 방식으로 수십만 행 규모의 게시글 테이블에서도 빠른 응답을 유지합니다",
    accent: "from-violet-500 to-fuchsia-500",
    shadow: "shadow-fuchsia-500/25",
  },
  {
    icon: PaletteIcon,
    title: "현대적인 UI",
    tag: "shadcn-vue · Tailwind",
    description:
      "Vuetify 3에서 shadcn-vue로 전면 교체하여 접근성과 커스터마이즈 용이성이 크게 좋아지고, 토큰만 수정해도 손쉽게 테마를 바꿀 수 있습니다",
    accent: "from-indigo-500 to-purple-500",
    shadow: "shadow-purple-500/25",
  },
  {
    icon: LayersIcon,
    title: "스킨 시스템",
    tag: "Skin System",
    description:
      "동적 임포트 기반 스킨 시스템을 내장으로 디자인과 기능이 완전히 분리되어, 사이트 전면 테마 교체가 가벼워집니다 (완전 지원은 v1.2.0 부터!)",
    accent: "from-emerald-500 to-teal-400",
    shadow: "shadow-emerald-500/25",
  },
] as const
</script>
