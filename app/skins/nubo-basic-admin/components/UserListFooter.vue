<template>
  <footer class="mt-8 flex flex-col items-center gap-8">
    <div class="flex rounded-lg border p-1">
      <Button size="sm" :variant="isBlocked ? 'ghost' : 'secondary'" @click="changeBlocked(false)">활성 사용자</Button>
      <Button size="sm" :variant="isBlocked ? 'secondary' : 'ghost'" @click="changeBlocked(true)">차단 사용자</Button>
    </div>
    <Pagination
      v-slot="{ page: currentPage, pageCount }"
      :items-per-page="limit"
      :total="userList.total"
      :sibling-count="1"
      show-edges
      :page="page"
      :default-page="page"
    >
      <PaginationContent v-slot="{ items }">
        <PaginationFirst v-show="currentPage > 1" class="cursor-pointer" @click="paging(1)">
          <ChevronFirstIcon class="w-10 h-10" />
        </PaginationFirst>

        <Button v-show="currentPage <= 1" variant="ghost" size="icon">
          <ChevronFirstIcon class="w-10 h-10 text-muted" />
        </Button>

        <PaginationPrevious v-show="currentPage > 1" class="cursor-pointer mr-2" @click="paging(currentPage - 1)">
          <ChevronLeftIcon class="w-10 h-10" />
        </PaginationPrevious>

        <Button v-show="currentPage <= 1" variant="ghost" size="icon" class="mr-2">
          <ChevronLeftIcon class="w-10 h-10 text-muted" />
        </Button>

        <template v-for="(item, index) in items">
          <PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
            <Button
              class="w-10 h-10 text-foreground cursor-pointer"
              :variant="item.value === currentPage ? 'default' : 'outline'"
              @click="paging(item.value)"
            >
              {{ item.value }}
            </Button>
          </PaginationListItem>

          <PaginationEllipsis v-else :key="item.type" :index="index" />
        </template>

        <PaginationNext
          v-show="currentPage < pageCount"
          class="cursor-pointer ml-2"
          @click="paging(currentPage + 1)"
        >
          <ChevronRightIcon class="w-10 h-10" />
        </PaginationNext>

        <Button v-show="currentPage >= pageCount" variant="ghost" size="icon" class="ml-2">
          <ChevronRightIcon class="w-10 h-10 text-muted" />
        </Button>

        <PaginationLast v-show="currentPage < pageCount" class="cursor-pointer" @click="paging(pageCount)">
          <ChevronLastIcon class="w-10 h-10" />
        </PaginationLast>

        <Button v-show="currentPage >= pageCount" variant="ghost" size="icon">
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
        v-model="keyword"
        type="text"
        placeholder="사용자 검색"
        @keyup.enter="search"
      />
      <Button
        variant="outline"
        class="cursor-pointer"
        :disabled="keyword.length < 2"
        @click="search"
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

const { userList, limit, page, option, keyword, isBlocked, loadInitUserList } = useNuboAdminContext()

const search = async () => {
  page.value = 1
  await loadInitUserList()
}

const changeBlocked = async (blocked: boolean) => {
  isBlocked.value = blocked
  page.value = 1
  await loadInitUserList()
}

// 페이징 처리
const paging = async (p: number) => {
  page.value = p
  await loadInitUserList()
}
</script>
