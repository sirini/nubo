<template>
  <h2>{{ option }} - {{ keyword }} 검색</h2>
</template>

<script setup lang="ts">
const route = useRoute()
const option = route.params.option as string
const keyword = route.params.keyword as string
</script>
