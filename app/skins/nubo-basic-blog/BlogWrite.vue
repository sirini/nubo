<template>
  <!-- 글쓰기 동작은 모든 게시판 종류가 공유합니다. 블로그만의 폼이 필요하면 이 래퍼부터 교체하세요. -->
  <DefaultWrite />
</template>

<script setup lang="ts">
import DefaultWrite from "../nubo-basic-board/DefaultWrite.vue"
</script>
