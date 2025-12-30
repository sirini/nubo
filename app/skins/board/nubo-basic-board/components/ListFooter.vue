<template>
  <footer class="mt-8 flex flex-col items-center gap-8">
    <Pagination
      :items-per-page="config.rowCount"
      :total="totalPostCount"
      :sibling-count="1"
      show-edges
      :page="page"
      :default-page="page"
      v-slot="{ page, pageCount }"
    >
      <PaginationContent v-slot="{ items }">
        <NuxtLink :to="setPagingUrl(1)" as-child v-show="page > 1">
          <CommonVTooltip content="첫 페이지로 이동합니다">
            <PaginationFirst class="cursor-pointer">
              <ChevronFirstIcon class="w-10 h-10" />
            </PaginationFirst>
          </CommonVTooltip>
        </NuxtLink>

        <NuxtLink :to="setPagingUrl(page - 1)" as-child v-show="page > 1">
          <CommonVTooltip content="이전 페이지로 이동합니다">
            <PaginationPrevious class="cursor-pointer mr-2">
              <ChevronLeftIcon class="w-10 h-10" />
            </PaginationPrevious>
          </CommonVTooltip>
        </NuxtLink>

        <template v-for="(item, index) in items">
          <PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
            <NuxtLink :to="setPagingUrl(item.value)" as-child>
              <Button
                class="w-10 h-10 text-foreground cursor-pointer"
                :variant="item.value === page ? 'default' : 'outline'"
              >
                {{ item.value }}
              </Button>
            </NuxtLink>
          </PaginationListItem>

          <PaginationEllipsis v-else :key="item.type" :index="index" />
        </template>

        <NuxtLink :to="setPagingUrl(page + 1)" as-child v-show="page < pageCount">
          <CommonVTooltip content="다음 페이지로 이동합니다">
            <PaginationNext class="cursor-pointer ml-2">
              <ChevronRightIcon class="w-10 h-10" />
            </PaginationNext>
          </CommonVTooltip>
        </NuxtLink>

        <NuxtLink :to="setPagingUrl(pageCount)" as-child v-show="page < pageCount">
          <CommonVTooltip content="마지막 페이지로 이동합니다">
            <PaginationLast class="cursor-pointer">
              <ChevronLastIcon class="w-10 h-10" />
            </PaginationLast>
          </CommonVTooltip>
        </NuxtLink>
      </PaginationContent>
    </Pagination>

    <div class="flex w-full max-w-sm items-center space-x-2">
      <Select v-model="option">
        <SelectTrigger class="w-25">
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
      <Input type="text" placeholder="게시판 내 검색" v-model="keyword" @keyup.enter="searchPost" />
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
import { SEARCH } from "~/types/board"
import { useNuboListContext } from "~/types/nubo-skin-keys"

const { config, totalPostCount, page, option, keyword, searchPost, setPagingUrl } =
  useNuboListContext()
</script>
