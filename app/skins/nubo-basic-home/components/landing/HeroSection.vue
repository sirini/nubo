<template>
  <section class="relative">
    <div
      class="mx-auto max-w-5xl px-6 pt-32 pb-24 text-center h-[calc(100dvh-180px)] md:h-full flex flex-col justify-center"
    >
      <h1
        data-reveal
        class="mb-5 font-bold tracking-[-0.04em] leading-none"
        style="animation-delay: 80ms"
      >
        <span
          class="block text-[5rem] sm:text-[7.5rem] md:text-[9rem] bg-[linear-gradient(110deg,#c7d2fe_0%,#a78bfa_25%,#f0abfc_50%,#a78bfa_75%,#c7d2fe_100%)] bg-size-[250%_auto] bg-clip-text text-transparent animate-shimmer drop-shadow-[0_0_40px_rgba(167,139,250,0.25)] font-black"
        >
          NUBO
        </span>
      </h1>

      <p
        data-reveal
        class="text-base sm:text-lg font-mono tracking-wider mb-6"
        style="animation-delay: 160ms"
      >
        <span class="text-slate-600">a </span>
        <span class="text-indigo-300 font-semibold">n</span><span class="text-slate-600">ew </span>
        <span class="text-indigo-300 font-semibold">u</span
        ><span class="text-slate-600">nified </span>
        <span class="text-indigo-300 font-semibold">bo</span><span class="text-slate-600">ard</span>
      </p>

      <p
        data-reveal
        class="mx-auto max-w-2xl sm:text-base text-slate-400 leading-relaxed mb-10"
        style="animation-delay: 240ms"
      >
        현대적인 커뮤니티 빌더
        <span class="text-slate-200">TSBOARD</span>의 다음 세대<br />
        SSR · 고효율 백엔드 · 스킨 시스템으로 다시 태어났습니다
      </p>

      <div
        data-reveal
        class="flex flex-wrap items-center justify-center gap-3"
        style="animation-delay: 320ms"
      >
        <CommonVTooltip content="클릭하시면 NUBO 사이트의 첫 페이지로 이동합니다">
          <Button
            as-child
            size="lg"
            class="group cursor-pointer font-bold relative h-12 px-6 rounded-xl border-0 bg-linear-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white shadow-[0_0_40px_-8px_rgba(168,85,247,0.65)] hover:shadow-[0_0_50px_-4px_rgba(168,85,247,0.85)] transition-shadow"
          >
            <span @click="moveToPage">
              <PanelTopIcon class="w-4 h-4 mr-2" />
              첫 화면으로 이동
              <ArrowRightIcon class="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </span>
          </Button>
        </CommonVTooltip>

        <CommonVTooltip content="NUBO 프로젝트에 사용된 코드는 모두 GitHub에 공개되어 있습니다 ⭐️">
          <Button
            as-child
            size="lg"
            variant="outline"
            class="h-12 px-6 rounded-xl text-slate-200 hover:bg-white/20 hover:text-white hover:border-white/20 backdrop-blur-sm"
          >
            <a href="https://github.com/sirini/nubo" target="_blank" rel="noopener noreferrer">
              <GitBranchIcon class="w-4 h-4 mr-2" />
              GitHub
              <ExternalLinkIcon
                class="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
              />
            </a>
          </Button>
        </CommonVTooltip>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRightIcon, ExternalLinkIcon, GitBranchIcon, PanelTopIcon } from "lucide-vue-next"

// 실제 홈 화면 이동 시 이후에 랜딩 페이지로 되돌아가지 않도록 하기
const router = useRouter()
const isLanding = defineModel()
const moveToPage = () => {
  isLanding.value = false
  router.push("/")
}
</script>
