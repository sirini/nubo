<template>
  <header class="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">{{ config.name }}</h1>
      <div class="text-muted-foreground mt-2 text-sm">{{ config.info }}</div>
    </div>

    <div class="flex items-center gap-2">
      <CommonVTooltip content="게시글 목록을 초기화합니다">
        <NuxtLink :to="`/board/${config.id}/page/1`" as-child class="gap-2">
          <Button variant="outline" class="cursor-pointer">
            <ListIcon class="w-4 h-4" />
            목록
          </Button>
        </NuxtLink>
      </CommonVTooltip>

      <CommonVTooltip content="[관리자] 게시판 관리화면으로 이동합니다">
        <NuxtLink :to="`/?todo=not_implemented_yet`" as-child class="gap-2">
          <Button v-if="isAdmin" variant="outline" class="cursor-pointer">
            <SettingsIcon class="w-4 h-4" />
            관리
          </Button>
        </NuxtLink>
      </CommonVTooltip>

      <CommonVTooltip v-if="isLoggedIn" content="새로운 글을 남겨보세요!">
        <NuxtLink :to="`/board/${config.id}/write`" class="gap-2" as-child>
          <Button variant="default" class="cursor-pointer text-foreground">
            <PencilIcon class="w-4 h-4" />
            글작성
          </Button>
        </NuxtLink>
      </CommonVTooltip>

      <CommonVTooltip v-else content="로그인 하시면 게시글 작성 등을 하실 수 있습니다">
        <NuxtLink :to="`/auth/login?redirect=/board/${config.id}/page/${page}`" class="gap-2">
          <Button variant="outline" class="cursor-pointer">
            <LogInIcon class="w-4 h-4" />
            로그인
          </Button>
        </NuxtLink>
      </CommonVTooltip>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ListIcon, LogInIcon, PencilIcon, SettingsIcon } from "lucide-vue-next"
import { useNuboListContext } from "~/providers/contexts/list"

const { isAdmin, isLoggedIn, config, page } = useNuboListContext()
</script>
