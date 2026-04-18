<template>
  <section class="relative">
    <div class="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <div
        data-reveal
        class="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-8 sm:p-12"
      >
        <div class="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div
          class="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <div
          class="absolute inset-0 opacity-[0.04]"
          :style="{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }"
        />

        <div class="relative grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge
              variant="outline"
              class="mb-5 border-indigo-400/30 bg-indigo-500/10 text-indigo-200 backdrop-blur-sm font-mono"
            >
              <RocketIcon class="w-3 h-3 mr-1.5" />
              Soon ··· v1.2.0
            </Badge>
            <h3
              class="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight leading-tight mb-5"
            >
              완전한
              <span
                class="bg-linear-to-r from-indigo-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent font-black"
              >
                스킨 시스템
              </span>
            </h3>
            <p class="text-sm sm:text-base text-slate-400 leading-relaxed mb-7">
              v1.1.x 안정화가 마무리되면, 일부 DB 스키마 확장과 함께 스킨 시스템이 완전체로
              공개됩니다. nuxt.config.ts 파일을 수정할 필요 없이, 관리 화면에서 변경하고 바로 적용해
              보실 수 있습니다.
            </p>
            <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div class="flex items-center gap-2">
                <div class="relative flex h-2 w-2">
                  <span
                    class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping"
                  />
                  <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <span class="text-slate-300">v1.1.0 안정화 진행</span>
              </div>
              <div class="h-3 w-px bg-white/10" />
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-slate-600" />
                <span>v1.2.0 완전한 스킨 시스템</span>
              </div>
            </div>
          </div>

          <div class="relative">
            <div
              class="relative rounded-2xl border border-white/10 bg-[#0B0B14] shadow-2xl overflow-hidden"
            >
              <div class="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
                <div class="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <div class="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <div class="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <div class="flex-1" />
                <span class="inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                  <TerminalIcon class="w-3 h-3" />
                  nubo.git/app/skins/
                </span>
              </div>

              <div class="p-5 font-mono text-[12.5px] space-y-1.5 text-slate-400">
                <div class="flex items-center gap-2 text-slate-200">
                  <PackageIcon class="w-3.5 h-3.5 text-indigo-300" />
                  <span>nubo-basic-admin/</span>
                </div>
                <div class="flex items-center gap-2 text-slate-200">
                  <PackageIcon class="w-3.5 h-3.5 text-indigo-300" />
                  <span>nubo-basic-board/</span>
                </div>
                <div class="flex items-center gap-2 text-slate-200">
                  <PackageIcon class="w-3.5 h-3.5 text-indigo-300" />
                  <span>nubo-basic-error/</span>
                </div>
                <div class="flex items-center gap-2 text-slate-200">
                  <PackageIcon class="w-3.5 h-3.5 text-indigo-300" />
                  <span>nubo-basic-home/</span>
                  <span class="ml-auto text-[10px] text-emerald-400/80 font-sans"
                    >landing or latest posts</span
                  >
                </div>
                <div class="pl-6 space-y-1">
                  <div class="flex items-center gap-2 text-slate-500">
                    <PackageIcon class="w-3 h-3" />
                    <span>components/</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-500 pl-6">
                    <Code2Icon class="w-3 h-3" />
                    <span>HomeMainPostCard.vue</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-500">
                    <Code2Icon class="w-3 h-3" />
                    <span>Home.vue</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-slate-200">
                  <PackageIcon class="w-3.5 h-3.5 text-indigo-300" />
                  <span class="text-slate-200/30">... (more) ...</span>
                  <span class="ml-auto text-[10px] text-emerald-400/80 font-sans"
                    >add your own skin here!</span
                  >
                </div>
              </div>
            </div>

            <div
              class="absolute -inset-4 -z-10 rounded-2xl bg-linear-to-br from-indigo-500/30 to-fuchsia-500/30 blur-2xl opacity-60"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Code2Icon, PackageIcon, RocketIcon, TerminalIcon } from "lucide-vue-next"
</script>
