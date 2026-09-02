<template>
  <Card v-if="badges.length">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-base">
        <AwardIcon class="size-4 text-primary" /> 활동 배지
      </CardTitle>
      <CardDescription>커뮤니티에서 한 번 획득하면 계속 간직하는 업적입니다.</CardDescription>
    </CardHeader>
    <CardContent>
      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="badge in badges"
          :key="badge.key"
          class="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/25 p-3"
        >
          <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20">
            <UserBadgeIcon :badge="badge" class="size-5" />
          </span>
          <span class="min-w-0">
            <strong class="block truncate text-sm">{{ badge.name }}</strong>
            <span class="mt-0.5 block text-xs leading-5 text-muted-foreground">{{ badge.description }}</span>
          </span>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { AwardIcon } from "lucide-vue-next"
import type { UserBadge } from "~/types/user"

defineProps<{ badges: UserBadge[] }>()
</script>
