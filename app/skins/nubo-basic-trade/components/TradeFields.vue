<template>
  <div class="grid gap-4 rounded-xl border border-border/70 bg-surface-subtle/35 p-4 sm:grid-cols-2">
    <label class="space-y-1.5 text-sm">브랜드 (선택)<Input v-model="trade.form.brand" maxlength="100" /></label>
    <label class="space-y-1.5 text-sm">상품 상태
      <select v-model.number="trade.form.productCondition" class="h-9 w-full rounded-md border bg-background px-3"><option v-for="(label, value) in conditions" :key="value" :value="value">{{ label }}</option></select>
    </label>
    <label class="space-y-1.5 text-sm">가격 방식
      <select v-model.number="trade.form.priceType" class="h-9 w-full rounded-md border bg-background px-3"><option :value="TRADE_PRICE.FIXED">정가</option><option :value="TRADE_PRICE.NEGOTIABLE">가격 제안 가능</option><option :value="TRADE_PRICE.FREE">무료나눔</option></select>
    </label>
    <label class="space-y-1.5 text-sm">가격 (원)<Input v-model.number="trade.form.price" type="number" min="0" :disabled="trade.form.priceType === TRADE_PRICE.FREE" /></label>
    <label class="space-y-1.5 text-sm">거래 방법
      <select v-model.number="trade.form.shippingType" class="h-9 w-full rounded-md border bg-background px-3"><option :value="TRADE_SHIPPING.PARCEL">택배</option><option :value="TRADE_SHIPPING.MEETUP">직거래</option><option :value="TRADE_SHIPPING.BOTH">택배 또는 직거래</option></select>
    </label>
    <label class="space-y-1.5 text-sm">직거래 지역<Input v-model="trade.form.location" maxlength="100" :disabled="trade.form.shippingType === TRADE_SHIPPING.PARCEL" placeholder="예: 서울 마포구" /></label>
    <p class="sm:col-span-2 text-xs text-muted-foreground">본문이나 첨부파일에 실제 상품 사진을 한 장 이상 넣어주세요.</p>
  </div>
</template>
<script setup lang="ts">
import { TRADE_PRICE, TRADE_SHIPPING } from "~/types/trade"
const trade = useTradeStore()
const conditions = { 0: "미개봉", 1: "새것에 가까움", 2: "사용감 적음", 3: "사용감 있음", 4: "수리·하자 있음" }
</script>
