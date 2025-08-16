<template>
  <form @submit="onSubmit" class="flex gap-2">
    <Select>
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

    <Button type="submit" class="text-foreground">찾기</Button>
  </form>
</template>

<script setup lang="ts">
import { SEARCH } from "~/types/board"
import { Select } from "../ui/select"
import SelectContent from "../ui/select/SelectContent.vue"
import SelectGroup from "../ui/select/SelectGroup.vue"
import SelectItem from "../ui/select/SelectItem.vue"
import SelectTrigger from "../ui/select/SelectTrigger.vue"
import SelectValue from "../ui/select/SelectValue.vue"

// 검색하기
function onSubmit() {
  // todo
}
</script>
