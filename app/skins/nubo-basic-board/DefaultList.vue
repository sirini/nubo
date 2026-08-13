<template>
  <section class="mx-auto px-4 py-8 sm:px-6 sm:py-12">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <ListHeader />

      <div class="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
        <Table class="table-fixed md:table-auto">
          <TableHeader class="hidden bg-surface-subtle/55 md:table-header-group">
            <TableRow>
              <TableHead class="w-20 text-center text-xs font-medium text-muted-foreground">
                추천
              </TableHead>
              <TableHead class="text-left text-xs font-medium text-muted-foreground">제목</TableHead>
              <TableHead class="w-30 text-center text-muted-foreground">글쓴이</TableHead>
              <TableHead class="w-25 text-center text-muted-foreground">날짜</TableHead>
              <TableHead class="w-20 text-center text-muted-foreground">조회</TableHead>
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
import { useNuboListContext } from "~/providers/contexts/list"
import ListFooter from "./components/list/ListFooter.vue"
import ListHeader from "./components/list/ListHeader.vue"
import ListNoticeRow from "./components/list/ListNoticeRow.vue"
import ListPostRow from "./components/list/ListPostRow.vue"

const { config } = useNuboListContext()
</script>
