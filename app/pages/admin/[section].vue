<template><AdminPage v-if="menu" :menu="menu" /></template>

<script setup lang="ts">
import AdminPage from "~/components/admin/AdminPage.vue"
import { adminMenuForPath, adminMenuPaths } from "~/utils/adminRoutes"

const route = useRoute()
const menu = computed(() => adminMenuForPath(`/admin/${route.params.section}`))

definePageMeta({
  validate: (route) => Object.values(adminMenuPaths).includes(`/admin/${route.params.section}`),
})
</script>
