<template>
  <footer class="mt-10 flex flex-col items-center gap-8">
    <Pagination
      v-slot="{ page: currentPage, pageCount }"
      :items-per-page="config.rowCount"
      :total="totalPostCount"
      :sibling-count="1"
      show-edges
      :page="page"
      :default-page="page"
    >
      <PaginationContent v-slot="{ items }" class="flex-wrap justify-center gap-1">
        <NuxtLink
          v-show="currentPage > 1"
          :to="setPagingUrl(1)"
          as-child
          class="hidden sm:inline-flex"
        >
          <CommonVTooltip content="첫 페이지로 이동합니다">
            <PaginationFirst class="cursor-pointer">
              <ChevronFirstIcon class="size-4" />
            </PaginationFirst>
          </CommonVTooltip>
        </NuxtLink>

        <Button
          v-show="currentPage <= 1"
          variant="ghost"
          size="icon"
          class="hidden sm:inline-flex"
        >
          <ChevronFirstIcon class="size-4 text-muted-foreground/40" />
        </Button>

        <NuxtLink
          v-show="currentPage > 1"
          :to="setPagingUrl(currentPage - 1)"
          as-child
          class="mr-2"
        >
          <CommonVTooltip content="이전 페이지로 이동합니다">
            <PaginationPrevious class="cursor-pointer">
              <ChevronLeftIcon class="size-4" />
            </PaginationPrevious>
          </CommonVTooltip>
        </NuxtLink>

        <Button v-show="currentPage <= 1" variant="ghost" size="icon" class="mr-2">
          <ChevronLeftIcon class="size-4 text-muted-foreground/40" />
        </Button>

        <template v-for="(item, index) in items">
          <PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
            <NuxtLink :to="setPagingUrl(item.value)" as-child>
              <Button
                class="size-9 cursor-pointer text-foreground sm:size-10"
                :variant="item.value === currentPage ? 'default' : 'outline'"
              >
                {{ item.value }}
              </Button>
            </NuxtLink>
          </PaginationListItem>

          <PaginationEllipsis v-else :key="item.type" :index="index" />
        </template>

        <NuxtLink
          v-show="currentPage < pageCount"
          :to="setPagingUrl(currentPage + 1)"
          as-child
          class="ml-2"
        >
          <CommonVTooltip content="다음 페이지로 이동합니다">
            <PaginationNext class="cursor-pointer">
              <ChevronRightIcon class="size-4" />
            </PaginationNext>
          </CommonVTooltip>
        </NuxtLink>

        <Button
          v-show="currentPage >= pageCount"
          variant="ghost"
          size="icon"
          class="ml-2"
        >
          <ChevronRightIcon class="size-4 text-muted-foreground/40" />
        </Button>

        <NuxtLink
          v-show="currentPage < pageCount"
          :to="setPagingUrl(pageCount)"
          as-child
          class="hidden sm:inline-flex"
        >
          <CommonVTooltip content="마지막 페이지로 이동합니다">
            <PaginationLast class="cursor-pointer">
              <ChevronLastIcon class="size-4" />
            </PaginationLast>
          </CommonVTooltip>
        </NuxtLink>

        <Button
          v-show="currentPage >= pageCount"
          variant="ghost"
          size="icon"
          class="hidden sm:inline-flex"
        >
          <ChevronLastIcon class="size-4 text-muted-foreground/40" />
        </Button>
      </PaginationContent>
    </Pagination>

    <div class="flex w-full max-w-md items-center gap-2">
      <Select v-model="option">
        <SelectTrigger class="w-28 shrink-0 bg-card/60">
          <SelectValue placeholder="제목" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="SEARCH.TITLE">제목</SelectItem>
          <SelectItem :value="SEARCH.CONTENT">내용</SelectItem>
          <SelectItem :value="SEARCH.WRITER">작성자</SelectItem>
          <SelectItem :value="SEARCH.TAG">태그</SelectItem>
          <SelectItem :value="SEARCH.IMAGEDESC">이미지</SelectItem>
        </SelectContent>
      </Select>
      <Input
        v-model="keyword"
        type="search"
        placeholder="게시판 내 검색"
        @keyup.enter="searchPost"
      />
      <Button
        variant="outline"
        class="cursor-pointer"
        :disabled="keyword.length < 2"
        @click="searchPost"
        >검색</Button
      >
    </div>
  </footer>

  <div class="h-20"></div>
</template>

<script setup lang="ts">
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-vue-next"
import { PaginationListItem } from "reka-ui"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination"
import { useNuboListContext } from "~/providers/contexts/list"
import { SEARCH } from "~/types/board"

const { config, totalPostCount, page, option, keyword, searchPost, setPagingUrl } =
  useNuboListContext()
</script>
