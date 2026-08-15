<template>
  <section class="mx-auto px-4 py-8 sm:px-6 sm:py-12">
    <div class="mx-auto" :style="`max-width: ${board.list.config.width}px`">
      <ListHeader />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <NuxtLink
          v-for="post in board.list.posts" :key="post.uid" :to="`/board/${board.list.config.id}/${post.uid}`"
          class="group overflow-hidden rounded-2xl border border-border/70 bg-card/70 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div class="aspect-[4/3] overflow-hidden bg-surface-subtle">
            <img
              v-if="cover(post)"
              :src="cover(post)"
              :alt="post.title"
              class="h-full w-full object-cover transition group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div v-else class="flex h-full items-center justify-center text-sm text-muted-foreground">상품 이미지 없음</div>
          </div>
          <div class="space-y-2 p-4">
            <div class="flex items-center justify-between gap-2">
              <Badge variant="secondary">{{ statusLabel(trade.items[post.uid]?.status) }}</Badge>
              <span class="text-xs text-muted-foreground">{{ post.category.name }}</span>
            </div>
            <h2 class="line-clamp-2 font-medium">{{ post.title }}</h2>
            <p class="text-lg font-semibold">{{ priceLabel(trade.items[post.uid]) }}</p>
            <div class="flex justify-between text-xs text-muted-foreground"><span>{{ post.writer.name }}</span><span>댓글 {{ post.comment }}</span></div>
          </div>
        </NuxtLink>
      </div>
      <ListFooter />
    </div>
  </section>
</template>

<script setup lang="ts">
import ListFooter from "../nubo-basic-board/components/list/ListFooter.vue"
import ListHeader from "../nubo-basic-board/components/list/ListHeader.vue"
import { TRADE_PRICE, type TradeInfo, type TradeStatus } from "~/types/trade"
import type { BoardListItem } from "~/types/board"
const board = useBoardStore()
const trade = useTradeStore()
const statusLabel = (status?: TradeStatus) => ["판매중", "예약중", "판매완료", "판매중단"][status ?? 0]
const priceLabel = (item?: TradeInfo) => !item ? "-" : item.priceType === TRADE_PRICE.FREE ? "무료나눔" : `${item.price.toLocaleString()}원${item.priceType === TRADE_PRICE.NEGOTIABLE ? " · 가격제안" : ""}`
const cover = (post: BoardListItem) => post.cover || post.content.match(/<img[^>]+src=["']([^"']+)/i)?.[1] || ""
</script>
