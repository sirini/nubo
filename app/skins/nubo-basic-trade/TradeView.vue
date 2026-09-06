<template>
  <section class="mx-auto px-4 py-8 sm:px-6 sm:py-12"><div class="mx-auto" :style="`max-width: ${config.width}px`">
    <ViewBreadcrumb />
    <article class="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
      <ViewImageCarousel v-if="view.images.length" />
      <div class="border-b border-border/70 p-5 sm:p-6">
        <div class="mb-3 flex flex-wrap items-center gap-2"><Badge>{{ statuses[trade.current.status] }}</Badge><Badge variant="outline">{{ conditions[trade.current.productCondition] }}</Badge><span v-if="trade.current.brand" class="text-sm text-muted-foreground">{{ trade.current.brand }}</span></div>
        <p class="text-2xl font-semibold">{{ price }}</p>
        <p class="mt-2 text-sm text-muted-foreground">{{ shipping }}<span v-if="trade.current.location"> · {{ trade.current.location }}</span></p>
        <div v-if="isWriter || isAdmin" class="mt-4 flex flex-wrap items-center gap-2">
          <span class="mr-1 text-xs font-medium text-muted-foreground">거래 상태 변경</span>
          <CommonVTooltip v-for="(label, value) in statuses" :key="value" :content="statusDescriptions[value] || label">
            <Button size="sm" :variant="trade.current.status === Number(value) ? 'default' : 'outline'" @click="trade.changeStatus(config.uid, view.post.uid, Number(value) as TradeStatus)">{{ label }}</Button>
          </CommonVTooltip>
        </div>
      </div>
      <ViewMainContent /><ViewAttachmentList v-if="view.files.length" />
    </article>
    <ViewWriterProfile class="mt-5 rounded-2xl border border-border/70 bg-card/55 p-5" />
    <section id="comments" class="scroll-mt-24 mt-8 rounded-2xl border border-border/70 bg-card/55 p-4 sm:p-6"><h2 class="mb-5 text-lg font-semibold">댓글 {{ view.post.comment }}</h2><ViewWriteComment /><ViewCommentList class="mt-8" /></section>
    <div class="my-10 flex justify-between"><ViewListButton /><div class="flex gap-3"><ViewModifyButton /><ViewWriteButton /></div></div>
  </div></section>
</template>
<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"
import { TRADE_PRICE, type TradeStatus } from "~/types/trade"
import ViewAttachmentList from "./components/view/ViewAttachmentList.vue"; import ViewBreadcrumb from "./components/view/ViewBreadcrumb.vue"; import ViewCommentList from "./components/view/ViewCommentList.vue"; import ViewImageCarousel from "./components/view/ViewImageCarousel.vue"; import ViewListButton from "./components/view/ViewListButton.vue"; import ViewMainContent from "./components/view/ViewMainContent.vue"; import ViewModifyButton from "./components/view/ViewModifyButton.vue"; import ViewWriteButton from "./components/view/ViewWriteButton.vue"; import ViewWriteComment from "./components/view/ViewWriteComment.vue"; import ViewWriterProfile from "./components/view/ViewWriterProfile.vue"
const { view, config, isWriter, isAdmin } = useNuboViewContext(); const trade = useTradeStore()
const statuses = ["판매중", "예약중", "판매완료", "판매중단"]; const conditions = ["미개봉", "새것에 가까움", "사용감 적음", "사용감 있음", "수리·하자 있음"]
const statusDescriptions = ["다른 회원이 구매할 수 있는 판매중 상태로 변경합니다", "구매자와 거래를 진행 중인 예약 상태로 변경합니다", "거래가 끝난 판매완료 상태로 변경합니다", "판매 글을 유지하면서 거래만 중단합니다"]
const price = computed(() => trade.current.priceType === TRADE_PRICE.FREE ? "무료나눔" : `${trade.current.price.toLocaleString()}원${trade.current.priceType === TRADE_PRICE.NEGOTIABLE ? " · 가격제안 가능" : ""}`)
const shipping = computed(() => ["택배", "직거래", "택배 또는 직거래"][trade.current.shippingType])
</script>
