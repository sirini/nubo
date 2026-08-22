<template>
  <section class="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <div class="mb-10 text-center">
      <h1 class="text-2xl font-bold tracking-tight">이용약관 및 커뮤니티 운영 원칙</h1>
      <p class="mt-4 text-muted-foreground">
        {{ title }}에서 서로의 창작물을 존중하며 안전하게 활동하기 위한 기준입니다.
      </p>
      <p class="mt-2 text-xs text-muted-foreground">시행일: 2026년 8월 21일</p>
    </div>

    <div class="space-y-8 leading-7">
      <section>
        <h2 class="mb-3 text-xl font-semibold">1. 서비스 이용과 게시물 책임</h2>
        <p>
          회원은 본인이 게시할 권리를 가진 사진과 글만 올려야 합니다. 게시물에 필요한 초상권,
          저작권 및 기타 권리를 확인할 책임은 작성자에게 있습니다.
        </p>
      </section>
      <Separator />
      <section>
        <h2 class="mb-3 text-xl font-semibold">2. 허용되지 않는 콘텐츠와 행동</h2>
        <ul class="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>아동 성착취물, 불법 촬영물, 성적 착취 또는 노골적인 성적 콘텐츠</li>
          <li>폭력·테러를 조장하거나 타인에게 구체적인 위해를 가하는 콘텐츠</li>
          <li>혐오 표현, 괴롭힘, 위협, 개인정보 노출 및 타인 사칭</li>
          <li>저작권 침해, 사진 도용, 사기, 불법 거래, 스팸과 반복 광고</li>
          <li>서비스 안정성을 해치거나 신고·차단 기능을 악용하는 행위</li>
        </ul>
      </section>
      <Separator />
      <section>
        <h2 class="mb-3 text-xl font-semibold">3. 신고, 차단과 운영 조치</h2>
        <p>
          사진과 사용자는 앱 또는 웹에서 신고할 수 있고, 원치 않는 사용자는 별도로 차단할 수
          있습니다. 운영자는 신고 내용을 검토해 게시물 삭제, 기능 제한 또는 계정 정지 등 필요한
          조치를 할 수 있습니다. 긴급한 안전 문제가 있으면 관리자에게 직접 알려주세요.
        </p>
      </section>
      <Separator />
      <section>
        <h2 class="mb-3 text-xl font-semibold">4. 계정과 데이터 삭제</h2>
        <p>
          회원은 앱의 프로필 화면 또는
          <NuxtLink to="/delete-account" class="font-medium text-primary underline underline-offset-4">
            웹 계정 삭제 페이지
          </NuxtLink>
          에서 계정과 연결 데이터를 영구 삭제할 수 있습니다.
        </p>
      </section>
      <Separator />
      <section>
        <h2 class="mb-3 text-xl font-semibold">5. 문의와 약관 변경</h2>
        <p>
          문의는 {{ admin }}으로 접수할 수 있습니다. 중요한 변경은 시행 전에 사이트 또는 앱을 통해
          알리며, 새 동의가 필요한 변경은 다시 확인을 요청할 수 있습니다.
        </p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: "NuboTermsPage" })

const config = useRuntimeConfig()
const title = computed(() => config.public.title)
const admin = computed(() => config.public.adminId)
</script>
