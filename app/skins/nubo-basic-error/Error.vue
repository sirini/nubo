<template>
  <main class="flex min-h-svh items-center justify-center bg-background px-5 py-12 text-foreground sm:px-8">
    <section aria-labelledby="error-title" class="w-full max-w-xl rounded-3xl border border-border/70 bg-card p-7 shadow-sm sm:p-12">
      <div class="mb-10 flex items-center justify-between gap-4">
        <span class="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CompassIcon class="size-6" aria-hidden="true" />
        </span>
        <span class="font-mono text-sm tracking-widest text-muted-foreground">{{ statusCode }}</span>
      </div>

      <p class="mb-3 text-xs font-semibold tracking-wider text-primary">잠시 길을 벗어났네요</p>
      <h1 id="error-title" class="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">{{ title }}</h1>
      <p class="mt-4 max-w-md break-keep text-sm leading-7 text-muted-foreground sm:text-base">{{ description }}</p>

      <div class="mt-9 border-t border-border/60 pt-7">
        <Button size="lg" class="w-full sm:w-auto" @click="clearError({ redirect: '/' })">
          <ArrowLeftIcon class="size-4" aria-hidden="true" />
          첫 화면으로 돌아가기
        </Button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, CompassIcon } from "lucide-vue-next"

defineOptions({ name: "NuboErrorPage" })

const error = useError()
const statusCode = computed(() => error.value?.statusCode || 404)
const title = computed(() => {
  if (statusCode.value === 404) return "페이지를 찾을 수 없어요"
  if (statusCode.value === 403) return "이 페이지는 열람할 수 없어요"
  return "페이지를 불러오지 못했어요"
})
const description = computed(() => {
  if (statusCode.value === 404) return "주소가 바뀌었거나 더 이상 공개되지 않는 페이지일 수 있어요. 첫 화면에서 새로운 이야기와 사진을 만나보세요."
  if (statusCode.value === 403) return "페이지를 볼 수 있는 권한이 없거나 공개 범위가 변경되었을 수 있어요. 첫 화면으로 돌아가 다른 게시글을 둘러보세요."
  return "일시적인 문제로 화면을 준비하지 못했어요. 잠시 후 다시 방문해 주세요."
})
</script>
