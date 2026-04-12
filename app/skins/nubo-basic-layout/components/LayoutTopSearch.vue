<template>
  <form @submit="search" class="flex gap-2">
    <CommonVSelect v-model="searchOption" :options="searchOptions" placeholder="검색 조건 선택" />

    <CommonVTooltip content="사이트 전체에서 검색합니다">
      <Input v-model="searchKeyword" type="text" placeholder="전체 검색"
    /></CommonVTooltip>

    <CommonVTooltip content="선택하신 검색 옵션과 키워드로 게시글을 찾아봅니다">
      <Button type="submit" variant="outline" class="text-foreground cursor-pointer"
        >찾기</Button
      ></CommonVTooltip
    >
  </form>
</template>

<script setup lang="ts">
import { useNuboLayoutContext } from "~/providers/contexts/layout"

const { searchOptions, searchOption, searchKeyword, search } = useNuboLayoutContext()
</script>
