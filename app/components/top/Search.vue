<template>
  <form @submit="onSubmit" class="flex gap-2">
    <Select v-model="home.option">
      <SelectTrigger>
        <SelectValue placeholder="검색 조건 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem :value="SEARCH.TITLE">제목</SelectItem>
          <SelectItem :value="SEARCH.CONTENT">내용</SelectItem>
          <SelectItem :value="SEARCH.WRITER">작성자</SelectItem>
          <SelectItem :value="SEARCH.TAG">태그</SelectItem>
          <SelectItem :value="SEARCH.IMAGEDESC">이미지</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>

    <Input v-model="home.keyword" type="text" placeholder="검색어를 입력하세요" />

    <Button type="submit" class="text-foreground">찾기</Button>
  </form>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner"
import { SEARCH } from "~/types/board"
import { Select } from "../ui/select"
import SelectContent from "../ui/select/SelectContent.vue"
import SelectGroup from "../ui/select/SelectGroup.vue"
import SelectItem from "../ui/select/SelectItem.vue"
import SelectTrigger from "../ui/select/SelectTrigger.vue"
import SelectValue from "../ui/select/SelectValue.vue"

const home = useHomeStore()

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
