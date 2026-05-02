<template>
  <header class="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">{{ config.name }}</h1>
      <div class="text-muted-foreground mt-2 text-sm">{{ config.info }}</div>
    </div>

    <div class="flex items-center gap-2">
      <CommonVTooltip content="게시글 목록을 초기화합니다">
        <NuxtLink :to="`/board/${config.id}/page/1`" as-child class="gap-2">
          <Button variant="outline" size="icon" class="cursor-pointer">
            <ListIcon class="w-4 h-4" />
          </Button>
        </NuxtLink>
      </CommonVTooltip>

      <CommonVTooltip content="[관리자] 게시판 관리화면으로 이동합니다">
        <NuxtLink :to="`/admin/board/${config.id}`" as-child>
          <Button v-if="isAdmin" variant="outline" size="icon" class="cursor-pointer">
            <SettingsIcon class="w-4 h-4" />
          </Button>
        </NuxtLink>
      </CommonVTooltip>

      <CommonVTooltip v-if="isLoggedIn" content="새로운 사진을 올려보세요!">
        <NuxtLink :to="`/board/${config.id}/write`" as-child>
          <Button variant="default" size="icon" class="cursor-pointer text-foreground">
            <ImageUpIcon class="w-4 h-4" />
          </Button>
        </NuxtLink>
      </CommonVTooltip>

      <CommonVTooltip v-else content="로그인 하시면 게시글 작성 등을 하실 수 있습니다">
        <NuxtLink :to="`/auth/login?redirect=/board/${config.id}/page/${page}`">
          <Button variant="outline" size="icon" class="cursor-pointer">
            <LogInIcon class="w-4 h-4" />
          </Button>
        </NuxtLink>
      </CommonVTooltip>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ImageUpIcon, ListIcon, LogInIcon, SettingsIcon } from "lucide-vue-next"
import { useNuboListContext } from "~/providers/contexts/list"

const { isAdmin, isLoggedIn, config, page } = useNuboListContext()
</script>
