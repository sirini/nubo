<template>
  <article class="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
    <header class="border-b border-border pb-7">
      <p class="mb-3 text-sm text-muted-foreground">{{ config.public.title }} · 서비스 정책</p>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{{ document.title }}</h1>
      <p v-if="!archived" class="mt-4 leading-7 text-muted-foreground">{{ document.intro }}</p>
      <p class="mt-4 text-sm text-muted-foreground">시행일: <time :datetime="archived ? previous?.date : document.effective">{{ archived ? previous?.date : document.effective }}</time></p>
      <nav aria-label="서비스 정책" class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <NuxtLink v-for="item in policies" :key="item.kind" :to="item.path" class="underline underline-offset-4" :aria-current="kind === item.kind ? 'page' : undefined">{{ item.title }}</NuxtLink>
      </nav>
    </header>

    <template v-if="archived">
      <aside role="status" class="my-6 rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6">
        이전 문서입니다. 당시 전문을 보존하며, 문서에 표시되는 사이트 이름·연락처는 현재 운영 설정입니다.
        <NuxtLink :to="basePath" class="underline underline-offset-4">현행 문서 보기</NuxtLink>
      </aside>
      <component :is="archived" />
    </template>
    <template v-else>
      <nav aria-label="문서 목차" class="my-8 rounded-lg border border-border bg-muted/20 p-5">
        <h2 class="mb-3 text-sm font-semibold">목차</h2>
        <ol class="grid gap-2 text-sm sm:grid-cols-2">
          <li v-for="(section, index) in document.sections" :key="section.title">
            <a :href="`#legal-section-${index + 1}`" class="text-muted-foreground underline-offset-4 hover:underline">{{ section.title }}</a>
          </li>
          <li><a href="#legal-contact" class="text-muted-foreground hover:underline">운영 정보 및 문의처</a></li>
          <li><a href="#legal-history" class="text-muted-foreground hover:underline">개정 이력</a></li>
        </ol>
      </nav>
      <div class="divide-y divide-border">
        <section v-for="(section, index) in document.sections" :id="`legal-section-${index + 1}`" :key="section.title" class="scroll-mt-24 py-7">
          <h2 class="mb-4 text-lg font-semibold">{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph" class="mt-3 break-words text-sm leading-7 sm:text-base sm:leading-8">{{ paragraph }}</p>
        </section>
      </div>
    </template>

    <section id="legal-contact" class="scroll-mt-24 border-t border-border py-7">
      <h2 class="mb-4 text-lg font-semibold">운영 정보 및 문의처</h2>
      <dl class="grid gap-2 text-sm leading-7 sm:grid-cols-[11rem_1fr]">
        <dt class="text-muted-foreground">서비스 운영 주체</dt><dd class="break-words">{{ operator }}</dd>
        <dt class="text-muted-foreground">개인정보 보호 담당자</dt><dd class="break-words">{{ config.public.legalOfficer || operator }}</dd>
        <dt class="text-muted-foreground">문의·권리침해 접수</dt><dd class="break-all"><a :href="`mailto:${email}`" class="underline underline-offset-4">{{ email }}</a></dd>
        <template v-if="config.public.legalAddress"><dt class="text-muted-foreground">주소</dt><dd>{{ config.public.legalAddress }}</dd></template>
      </dl>
      <div class="mt-5 flex flex-wrap gap-5 text-sm">
        <NuxtLink to="/support" class="underline underline-offset-4">고객 지원</NuxtLink>
        <NuxtLink to="/delete-account" class="underline underline-offset-4">계정 및 데이터 삭제</NuxtLink>
      </div>
      <template v-if="kind === 'privacy' && !archived">
        <h3 class="mb-3 mt-7 font-semibold">이 운영처의 개인정보 처리 상세</h3>
        <p v-if="config.public.legalProcessingDetails" class="whitespace-pre-line break-words text-sm leading-7">{{ config.public.legalProcessingDetails }}</p>
        <p v-else class="text-sm leading-7 text-muted-foreground">추가 처리 상세가 등록되지 않았습니다. 실제 외부 연동·위탁·국외 이전 여부와 접속 로그·백업 등의 보유기간은 위 담당자에게 확인할 수 있습니다. 운영자는 해당 처리를 시행하기 전에 적용 항목과 근거·기간을 공개해야 합니다.</p>
      </template>
    </section>
    <section id="legal-history" class="scroll-mt-24 border-t border-border py-7">
      <h2 class="mb-4 text-lg font-semibold">개정 이력</h2>
      <ul class="space-y-3 text-sm leading-6">
        <li><NuxtLink :to="basePath" class="underline underline-offset-4">{{ document.effective }} · 현행</NuxtLink><p class="text-muted-foreground">{{ document.summary }}</p></li>
        <li v-if="previous"><NuxtLink :to="`${basePath}?version=${previous.date}`" class="underline underline-offset-4">{{ previous.date }} · 이전 전문</NuxtLink><p class="text-muted-foreground">기존 서비스 정책 보존</p></li>
      </ul>
    </section>
  </article>
</template>

<script setup lang="ts">
import terms from "~/data/legal/terms.json"
import privacy from "~/data/legal/privacy.json"
import disclaimer from "~/data/legal/disclaimer.json"
import PrivacyArchive from "./archive/Privacy20260906.vue"
import TermsArchive from "./archive/Terms20260821.vue"

const props = defineProps<{ kind: "terms" | "privacy" | "disclaimer" }>()
const config = useRuntimeConfig()
const route = useRoute()
const documents = { terms, privacy, disclaimer }
const policies = [
  { kind: "terms", path: "/terms", title: "이용약관" },
  { kind: "privacy", path: "/privacy", title: "개인정보처리방침" },
  { kind: "disclaimer", path: "/disclaimer", title: "책임의 한계와 법적고지" },
]
const document = computed(() => documents[props.kind])
const basePath = computed(() => `/${props.kind}`)
const previous = computed(() => props.kind === "privacy" ? { date: "2026-09-06", component: PrivacyArchive } : props.kind === "terms" ? { date: "2026-08-21", component: TermsArchive } : undefined)
const archived = computed(() => route.query.version && route.query.version === previous.value?.date ? previous.value.component : undefined)
// Unknown versions must never silently display the current policy as an old version.
watchEffect(() => {
  if (route.query.version && route.query.version !== document.value.effective && route.query.version !== previous.value?.date) {
    throw createError({ statusCode: 404, statusMessage: "Policy version not found" })
  }
})
const operator = computed(() => config.public.legalOperator || config.public.title)
const email = computed(() => config.public.legalEmail || config.public.adminId)
useHead(() => ({ title: document.value.title, meta: [{ name: "robots", content: archived.value ? "noindex,follow" : "index,follow" }] }))
</script>
