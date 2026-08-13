<template>
  <footer class="flex flex-col items-center gap-6 px-4 py-8">
    <Pagination v-slot="{ pageCount }" :items-per-page="limit" :total="reportTotal" :page="page" :default-page="page" :sibling-count="1" show-edges>
      <PaginationContent>
        <PaginationFirst :disabled="page <= 1" @click="paging(1)" />
        <PaginationPrevious :disabled="page <= 1" @click="paging(page - 1)" />
        <span class="px-3 text-sm text-muted-foreground">{{ page }} / {{ Math.max(pageCount, 1) }}</span>
        <PaginationNext :disabled="page >= pageCount" @click="paging(page + 1)" />
        <PaginationLast :disabled="page >= pageCount" @click="paging(pageCount)" />
      </PaginationContent>
    </Pagination>

    <div class="flex w-full max-w-lg items-center gap-2">
      <Select v-model="option">
        <SelectTrigger class="w-28 shrink-0"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem :value="SEARCH.REPORT.REQUEST">내용</SelectItem>
          <SelectItem :value="SEARCH.REPORT.FROM">신고자</SelectItem>
          <SelectItem :value="SEARCH.REPORT.TO">대상자</SelectItem>
        </SelectContent>
      </Select>
      <Input v-model="keyword" placeholder="신고 검색" @keyup.enter="search" />
      <Button variant="outline" class="cursor-pointer" @click="search">검색</Button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useNuboAdminContext } from "~/providers/contexts/admin"
import { SEARCH } from "~/types/board"

const props = defineProps<{ isSolved: boolean }>()
const { reportTotal, limit, page, option, keyword, loadInitReportList } = useNuboAdminContext()

const reload = () => loadInitReportList(props.isSolved)
const paging = async (target: number) => {
  if (target < 1) return
  page.value = target
  await reload()
}
const search = async () => {
  page.value = 1
  await reload()
}
</script>
