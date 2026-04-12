<template>
  <footer class="mt-8 flex flex-col items-center gap-8">
    <Pagination
      :items-per-page="limit"
      :total="userList.total"
      :sibling-count="1"
      show-edges
      :page="page"
      :default-page="page"
      v-slot="{ page, pageCount }"
    >
      <PaginationContent v-slot="{ items }">
        <PaginationFirst class="cursor-pointer" @click="paging(1)" v-show="page > 1">
          <ChevronFirstIcon class="w-10 h-10" />
        </PaginationFirst>

        <Button variant="ghost" size="icon" v-show="page <= 1">
          <ChevronFirstIcon class="w-10 h-10 text-muted" />
        </Button>

        <PaginationPrevious class="cursor-pointer mr-2" @click="paging(page - 1)" v-show="page > 1">
          <ChevronLeftIcon class="w-10 h-10" />
        </PaginationPrevious>

        <Button variant="ghost" size="icon" v-show="page <= 1" class="mr-2">
          <ChevronLeftIcon class="w-10 h-10 text-muted" />
        </Button>

        <template v-for="(item, index) in items">
          <PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
            <Button
              class="w-10 h-10 text-foreground cursor-pointer"
              :variant="item.value === page ? 'default' : 'outline'"
              @click="paging(item.value)"
            >
              {{ item.value }}
            </Button>
          </PaginationListItem>

          <PaginationEllipsis v-else :key="item.type" :index="index" />
        </template>

        <PaginationNext
          class="cursor-pointer ml-2"
          @click="paging(page + 1)"
          v-show="page < pageCount"
        >
          <ChevronRightIcon class="w-10 h-10" />
        </PaginationNext>

        <Button variant="ghost" size="icon" v-show="page >= pageCount" class="ml-2">
          <ChevronRightIcon class="w-10 h-10 text-muted" />
        </Button>

        <PaginationLast class="cursor-pointer" v-show="page < pageCount" @click="paging(pageCount)">
          <ChevronLastIcon class="w-10 h-10" />
        </PaginationLast>

        <Button variant="ghost" size="icon" v-show="page >= pageCount">
          <ChevronLastIcon class="w-10 h-10 text-muted" />
        </Button>
      </PaginationContent>
    </Pagination>

    <div class="flex w-full max-w-sm items-center space-x-2">
      <Select v-model="option">
        <SelectTrigger class="w-25">
          <SelectValue placeholder="이름" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="SEARCH.USER.NAME">이름</SelectItem>
          <SelectItem :value="SEARCH.USER.ID">아이디</SelectItem>
          <SelectItem :value="SEARCH.USER.LEVEL">레벨</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="text"
        placeholder="사용자 검색"
        v-model="keyword"
        @keyup.enter="loadInitUserList"
      />
      <Button
        variant="outline"
        class="cursor-pointer"
        :disabled="keyword.length < 2"
        @click="loadInitUserList"
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
import { useNuboAdminContext } from "~/providers/contexts/admin"
import { SEARCH } from "~/types/board"

const { userList, limit, page, option, keyword, loadInitUserList } = useNuboAdminContext()

// 페이징 처리
const paging = async (p: number) => {
  page.value = p
  await loadInitUserList()
}
</script>
