<template>
  <section class="container mx-auto py-4">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <ListHeader />

      <div class="rounded-md border bg-card">
        <Table>
          <TableHeader class="hidden md:table-header-group">
            <TableRow>
              <TableHead class="w-20 text-center">번호</TableHead>
              <TableHead class="text-center">제목</TableHead>
              <TableHead class="w-30 text-center">글쓴이</TableHead>
              <TableHead class="w-25 text-center">날짜</TableHead>
              <TableHead class="w-20 text-center">조회</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <ListNoticeRow />
            <ListPostRow />
          </TableBody>
        </Table>
      </div>

      <ListFooter />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Table, TableBody, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { useNuboListContext } from "~/types/nubo-skin-keys"
import ListFooter from "./components/ListFooter.vue"
import ListHeader from "./components/ListHeader.vue"
import ListNoticeRow from "./components/ListNoticeRow.vue"
import ListPostRow from "./components/ListPostRow.vue"

const { config } = useNuboListContext()
</script>
