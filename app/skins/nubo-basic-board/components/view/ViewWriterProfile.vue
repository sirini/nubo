<template>
  <div class="flex items-center justify-between">
    <div class="inline-flex gap-3 items-center">
      <Avatar class="border-2 shadow-lg w-12 h-12">
        <AvatarImage :src="view.post.writer.profile" alt="Profile image" />
        <AvatarFallback>{{ recoverChars(view.post.writer.name).charAt(0) }}</AvatarFallback>
      </Avatar>
      <h3 class="text-lg font-semibold tracking-tight">
        {{ recoverChars(view.post.writer.name) }}님
      </h3>
    </div>

    <Button variant="link" class="text-muted-foreground p-0 h-auto cursor-pointer" as-child>
      <NuxtLink :to="`/user/${view.post.writer.uid}`">
        프로필 <ArrowRightIcon class="ml-1 h-4 w-4" />
      </NuxtLink>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ArrowRightIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view } = useNuboViewContext()
</script>
