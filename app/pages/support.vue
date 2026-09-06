<template>
  <section class="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <div class="mb-10 text-center">
      <div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
        <LifeBuoyIcon class="size-6 text-primary" />
      </div>
      <h1 class="text-2xl font-bold tracking-tight">{{ title }} 지원</h1>
      <p class="mt-4 leading-7 text-muted-foreground">
        앱 이용 문제, 계정 문의, 신고 처리와 기능 의견을 아래 연락처로 보내주세요.
      </p>
    </div>

    <Card class="overflow-hidden">
      <CardHeader>
        <CardTitle class="text-xl">이메일 문의</CardTitle>
        <CardDescription class="leading-6">
          비밀번호, 인증 코드, Apple·Google 로그인 토큰은 메일에 적지 마세요.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <Button as-child class="h-11 w-full sm:w-auto">
          <a :href="mailtoHref" aria-label="지원 이메일 보내기">
            <MailIcon class="size-4" />
            {{ admin }}
          </a>
        </Button>

        <div class="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm leading-6">
          <p class="font-semibold">빠른 확인을 위해 함께 알려주세요</p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>사용 기기와 iOS 또는 브라우저 버전</li>
            <li>문제가 발생한 화면과 직전에 수행한 동작</li>
            <li>반복해서 발생하는지 여부와 민감정보를 가린 화면 캡처</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="text-base">신고와 차단</CardTitle>
          <CardDescription class="leading-6">
            사진 상세 또는 사용자 프로필의 신고·차단 기능을 먼저 이용해주세요. 긴급한 안전 문제나
            처리 문의는 지원 이메일로 알려주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NuxtLink to="/terms" class="font-medium text-primary underline underline-offset-4">
            커뮤니티 운영 원칙 보기
          </NuxtLink>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-base">계정과 개인정보</CardTitle>
          <CardDescription class="leading-6">
            앱과 웹에서 계정 정보를 관리할 수 있으며, 계정 및 연결 데이터의 영구 삭제도 직접 요청할 수
            있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-2">
          <NuxtLink
            to="/delete-account"
            class="font-medium text-primary underline underline-offset-4"
          >
            계정 및 데이터 삭제
          </NuxtLink>
          <NuxtLink to="/privacy" class="font-medium text-primary underline underline-offset-4">
            개인정보 처리방침
          </NuxtLink>
        </CardContent>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { LifeBuoyIcon, MailIcon } from "lucide-vue-next"

defineOptions({ name: "NuboSupportPage" })

const config = useRuntimeConfig()
const title = computed(() => config.public.title)
const admin = computed(() => config.public.adminId)
const mailtoHref = computed(
  () => `mailto:${admin.value}?subject=${encodeURIComponent(`${title.value} 지원 문의`)}`,
)

useSeoMeta({
  title: () => `${title.value} 지원`,
  description: () => `${title.value} 앱과 웹 서비스 이용에 관한 지원 및 문의 안내`,
})
</script>
