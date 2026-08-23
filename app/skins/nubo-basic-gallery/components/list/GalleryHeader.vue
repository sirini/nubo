<template>
  <header class="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
    <div class="min-w-0">
      <div class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Gallery</div>
      <h1 class="truncate text-3xl font-semibold tracking-[-0.035em]">
        {{ recoverChars(config.name) }}
      </h1>
      <p class="mt-2 text-sm leading-6 text-muted-foreground">
        {{ recoverChars(config.info) }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
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
          <Button variant="default" class="cursor-pointer gap-2">
            <ImageUpIcon class="w-4 h-4" />
            사진 올리기
          </Button>
        </NuxtLink>
      </CommonVTooltip>

      <CommonVTooltip v-else content="로그인 하시면 게시글 작성 등을 하실 수 있습니다">
        <NuxtLink :to="`/auth/login?redirect=/board/${config.id}/page/${page}`">
          <Button variant="outline" class="cursor-pointer gap-2">
            <LogInIcon class="w-4 h-4" />
            로그인
          </Button>
        </NuxtLink>
      </CommonVTooltip>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ImageUpIcon, ListIcon, LogInIcon, SettingsIcon } from "lucide-vue-next"
import { useNuboListContext } from "~/providers/contexts/list"

// 권한 값은 버튼 노출에만, config/page는 갤러리 소개와 현재 목록 URL에 사용합니다.
const { isAdmin, isLoggedIn, config, page } = useNuboListContext()
</script>
