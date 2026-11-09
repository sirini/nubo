<template>
  <div>
    <div class="mx-auto grid max-w-[1480px] min-w-0 lg:grid-cols-[minmax(0,1fr)_200px]">
      <LatestPosts />
      <aside class="hidden border-l border-border/50 px-5 py-10 lg:block">
        <div class="sticky top-24">
          <LegalLinks class="flex-col leading-6" />
        </div>
      </aside>
    </div>
    <LegalFooter />
  </div>
</template>

<script setup lang="ts">
import LatestPosts from "./LatestPosts.vue"
import LegalLinks from "~/components/legal/LegalLinks.vue"
import LegalFooter from "~/components/legal/LegalFooter.vue"

defineOptions({ name: "NuboBasicHome" })
</script>
