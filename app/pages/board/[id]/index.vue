<template></template>

<script setup lang="ts">
const route = useRoute()
const boardId = route.params.id as string
navigateTo(`/board/${boardId}/page/1`)
</script>
