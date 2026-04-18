<template>
  <footer class="relative border-t border-white/5">
    <div
      class="mx-auto max-w-5xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500"
    >
      <div class="flex items-center gap-2.5">
        <span class="font-semibold text-slate-300 tracking-wide">NUBO</span>
        <span class="text-slate-700">·</span>
        <span>a new unified board</span>
      </div>

      <CommonVTooltip content="이 프로젝트가 마음에 드셨다면 ⭐️ 을 눌러주세요!">
        <div>
          Built by
          <a
            href="https://github.com/sirini"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-300 hover:text-white transition-colors"
          >
            @sirini
          </a>
        </div>
      </CommonVTooltip>
    </div>
  </footer>
</template>
