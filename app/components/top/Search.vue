<template>
  <form @submit="onSubmit" class="flex gap-2">
    <CommonVSelect v-model="home.option" :options="options" placeholder="검색 조건 선택" />
    <Input v-model="home.keyword" type="text" placeholder="검색어를 입력하세요" />
    <Button type="submit" class="text-foreground">찾기</Button>
  </form>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner"
import { SEARCH } from "~/types/board"

const home = useHomeStore()
const options = [
  { label: "제목", value: SEARCH.TITLE },
  { label: "내용", value: SEARCH.CONTENT },
  { label: "작성자", value: SEARCH.WRITER },
  { label: "태그", value: SEARCH.TAG },
  { label: "이미지", value: SEARCH.IMAGEDESC },
]

// 검색하기
function onSubmit(event: Event) {
  event.preventDefault()
  if (home.keyword.length < 2) {
    toast("검색어는 2글자 이상 입력해주세요!")
    return
  }
  home.setFilter(home.option, home.keyword)
  home.keyword = ""
}
</script>
