<template><AdminAdminPage /></template>

<script setup lang="ts">
import { adminMenuPaths } from "~/utils/adminRoutes"

definePageMeta({
  validate: (route) => Object.values(adminMenuPaths).includes(`/admin/${route.params.section}`),
})
</script>
