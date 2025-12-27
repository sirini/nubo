<template>
  <form @submit="search" class="flex gap-2">
    <CommonVSelect v-model="searchOption" :options="searchOptions" placeholder="검색 조건 선택" />

    <CommonVTooltip content="검색어는 2글자 이상 입력해주세요">
      <Input v-model="searchKeyword" type="text" placeholder="검색어를 입력하세요"
    /></CommonVTooltip>

    <CommonVTooltip content="선택하신 검색 옵션과 키워드로 게시글을 찾아봅니다">
      <Button
        type="submit"
        variant="outline"
        class="text-foreground"
        :disabled="searchKeyword.length < 2"
        >찾기</Button
      ></CommonVTooltip
    >
  </form>
</template>

<script setup lang="ts">
import { useNuboLayoutContext } from "~/types/nubo-skin-keys"

const { searchOptions, searchOption, searchKeyword, search } = useNuboLayoutContext()
</script>
