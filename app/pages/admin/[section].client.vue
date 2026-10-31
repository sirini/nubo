<template><AdminPage /></template>

<script setup lang="ts">
import AdminPage from "~/components/admin/AdminPage.vue"
import { adminMenuPaths } from "~/utils/adminRoutes"

definePageMeta({
  validate: (route) => Object.values(adminMenuPaths).includes(`/admin/${route.params.section}`),
})
</script>
