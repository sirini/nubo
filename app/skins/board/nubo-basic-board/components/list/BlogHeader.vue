<template>
  <section class="relative py-12 md:py-16 bg-muted/30 rounded-lg border shadow-md">
    <div class="container mx-auto px-4 text-center flex flex-col items-center">
      <Avatar class="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg mb-12">
        <AvatarImage :src="posts.at(0)?.writer.profile || ''" alt="Author profile" />
        <AvatarFallback>{{ posts.at(0)?.writer.name.slice(0, 2) || "ME" }}</AvatarFallback>
      </Avatar>
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
        {{ config.name }}
      </h1>
      <div class="text-xl text-muted-foreground leading-relaxed">
        {{ config.info }}
      </div>
      <div class="flex items-center gap-3 mt-8 leading-relaxed">
        <CommonVTooltip content="RSS 피드 보기">
          <NuxtLink :to="`${cfg.public.domain}/${cfg.public.goapiBase}/rss/${config.id}`" as-child>
            <Button variant="outline" size="icon" class="cursor-pointer">
              <RssIcon class="w-4 h-4" />
            </Button>
          </NuxtLink>
        </CommonVTooltip>

        <CommonVTooltip content="게시글 목록을 초기화합니다">
          <NuxtLink :to="`/board/${config.id}/page/1`" as-child>
            <Button variant="outline" size="icon" class="cursor-pointer">
              <ListIcon class="w-4 h-4" />
            </Button>
          </NuxtLink>
        </CommonVTooltip>

        <CommonVTooltip v-if="isAdmin" content="[관리자] 게시판 관리화면으로 이동합니다">
          <NuxtLink :to="`/?todo=not_implemented_yet`" as-child>
            <Button variant="outline" size="icon" class="cursor-pointer">
              <SettingsIcon class="w-4 h-4" />
            </Button>
          </NuxtLink>
        </CommonVTooltip>

        <CommonVTooltip
          v-if="!isLoggedIn"
          content="로그인 하시면 게시글 작성 등을 하실 수 있습니다"
        >
          <NuxtLink :to="`/auth/login?redirect=/board/${config.id}/page/${page}`" as-child>
            <Button variant="outline" size="icon" class="cursor-pointer">
              <LogInIcon class="w-4 h-4" />
            </Button>
          </NuxtLink>
        </CommonVTooltip>

        <CommonVTooltip v-else content="새로운 글을 남겨보세요!">
          <NuxtLink :to="`/board/${config.id}/write`" as-child>
            <Button variant="default" size="icon" class="cursor-pointer text-foreground">
              <NotebookPenIcon class="w-4 h-4" />
            </Button>
          </NuxtLink>
        </CommonVTooltip>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ListIcon, LogInIcon, NotebookPenIcon, RssIcon, SettingsIcon } from "lucide-vue-next"
import { useNuboListContext } from "~/types/nubo-skin-keys"

const cfg = useRuntimeConfig()
const { config, isAdmin, isLoggedIn, page, posts } = useNuboListContext()
</script>
