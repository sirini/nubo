<template>
  <SidebarMenuItem>
    <SidebarMenuButton>
      <component :is="MessagesSquare" />
      <h3 class="text-lg font-bold">Nubohub</h3>
    </SidebarMenuButton>
  </SidebarMenuItem>
</template>

<script setup lang="ts">
import { MessagesSquare } from "lucide-vue-next"
</script>
