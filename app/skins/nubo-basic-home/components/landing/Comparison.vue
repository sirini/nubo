<template>
  <section class="relative">
    <div class="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <div data-reveal class="text-center mb-14">
        <Badge
          variant="outline"
          class="mb-5 border-white/10 bg-white/3 text-slate-300 backdrop-blur-sm"
        >
          <BookOpenCheckIcon class="w-3 h-3 mr-1.5 text-indigo-400" />
          Comparison
        </Badge>
        <h2 class="text-4xl sm:text-5xl font-black tracking-tight text-slate-100 mb-4">
          한 눈에 보는 변화
        </h2>
        <p class="text text-slate-400">
          기존 DB 스키마를 그대로 유지했기에, 스택만 갈아타면 바로 NUBO입니다
        </p>
      </div>

      <div
        data-reveal
        class="relative rounded-2xl border border-white/10 bg-white/2 backdrop-blur-sm overflow-hidden"
      >
        <div
          class="grid grid-cols-2 md:grid-cols-[1.1fr_1.2fr_1.2fr] border-b border-white/10 bg-white/1.5"
        >
          <div
            class="hidden md:block p-4 sm:p-5 text-[11px] uppercase tracking-[0.2em] text-slate-500"
          >
            항목
          </div>
          <div
            class="p-4 sm:p-5 text-[11px] uppercase tracking-[0.2em] text-slate-500 border-l border-white/5 flex items-center gap-2"
          >
            TSBOARD
          </div>
          <div
            class="p-4 sm:p-5 text-[11px] uppercase tracking-[0.2em] border-l border-white/5 flex items-center gap-2 text-indigo-200"
          >
            NUBO
          </div>
        </div>

        <div
          v-for="row in comparison"
          :key="row.label"
          class="grid grid-cols-2 md:grid-cols-[1.1fr_1.2fr_1.2fr] border-b border-white/5 last:border-b-0 transition-colors hover:bg-white/1.5"
        >
          <div class="hidden md:block p-4 sm:p-5 text-sm text-slate-200 font-medium">
            {{ row.label }}
          </div>
          <div
            class="p-4 sm:p-5 border-l border-white/5 text-sm text-slate-500 flex items-center gap-2"
          >
            <XCircleIcon class="w-3.5 h-3.5 shrink-0 text-slate-600" />
            <span>{{ row.old }}</span>
          </div>
          <div
            class="p-4 sm:p-5 border-l border-white/5 text-sm text-slate-100 flex items-center gap-2"
          >
            <CheckCircle2Icon class="w-3.5 h-3.5 shrink-0 text-indigo-400" />
            <span>{{ row.new }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { BookOpenCheckIcon, CheckCircle2Icon, XCircleIcon } from "lucide-vue-next"

const comparison = [
  { label: "렌더링", old: "클라이언트 렌더링", new: "서버 + 클라이언트" },
  { label: "SEO", old: "SEO 부족함", new: "완전하게 지원함" },
  { label: "UI 프레임워크", old: "Vuetify 3", new: "shadcn-vue" },
  { label: "페이지네이션", old: "페이징 불가", new: "고효율의 페이징" },
  { label: "스킨 시스템", old: "스킨 미지원", new: "스킨 지원" },
  { label: "DB 스키마", old: "TSBOARD 구조", new: "DB 동일 (~v1.2.0)" },
] as const
</script>
