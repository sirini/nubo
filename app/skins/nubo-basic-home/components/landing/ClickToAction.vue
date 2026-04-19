<template>
  <section class="relative">
    <div
      class="mx-auto max-w-5xl px-6 pt-24 pb-48 text-center flex flex-col justify-center h-[calc(100dvh-140px)] md:h-full"
    >
      <div data-reveal>
        <h2 class="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight mb-5">
          <span class="text-slate-100">지금 바로</span>
          <br />
          <span
            class="bg-linear-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent font-black"
          >
            NUBO를 만나보세요
          </span>
        </h2>
        <p class="text-sm sm:text-base text-slate-400 mb-10">
          오픈소스로 공개되는 가장 현대적인 커뮤니티 빌더
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3 mb-10">
          <Button
            as-child
            size="lg"
            class="group h-12 px-7 rounded-xl border-0 bg-linear-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white shadow-[0_0_40px_-8px_rgba(168,85,247,0.65)] hover:shadow-[0_0_60px_-4px_rgba(168,85,247,0.85)] transition-shadow font-black"
          >
            <NuxtLink @click="moveToPage" class="cursor-pointer">
              <PanelTopIcon class="w-4 h-4 mr-2" />
              첫 화면으로 이동
              <ArrowRightIcon class="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </NuxtLink>
          </Button>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm">
          <CommonVTooltip
            content="NUBO의 프론트엔드 및 백엔드 바이너리 파일(Linux/x64)을 함께 내려 받으실 수 있습니다"
          >
            <Button
              as-child
              variant="ghost"
              size="sm"
              class="text-slate-400 hover:text-slate-100 hover:bg-white/5"
            >
              <a
                href="https://github.com/sirini/nubo"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center"
              >
                <BrushIcon class="w-3 h-3" />
                nubo
                <span class="ml-2 text-[10px] uppercase tracking-wider text-slate-600">
                  Frontend
                </span>
              </a>
            </Button>
          </CommonVTooltip>

          <CommonVTooltip
            content="Go 언어로 작성된 고효율 백엔드 바이너리는 이 곳에서 코드를 받아서 직접 수정해 보실 수 있습니다"
          >
            <Button
              as-child
              variant="ghost"
              size="sm"
              class="text-slate-400 hover:text-slate-100 hover:bg-white/5"
            >
              <a
                href="https://github.com/sirini/goapi"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center"
              >
                <DatabaseIcon class="w-3 h-3" />
                goapi
                <span class="ml-2 text-[10px] uppercase tracking-wider text-slate-600">
                  Backend
                </span>
              </a>
            </Button>
          </CommonVTooltip>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRightIcon, BrushIcon, DatabaseIcon, PanelTopIcon } from "lucide-vue-next"
import { useNuboHomeContext } from "~/providers/contexts/home"

// 실제 홈 화면 이동 시 이후에 랜딩 페이지로 되돌아가지 않도록 하기
const router = useRouter()
const { isLanding } = useNuboHomeContext()
const moveToPage = () => {
  isLanding.value = false
  router.push("/")
}
</script>
