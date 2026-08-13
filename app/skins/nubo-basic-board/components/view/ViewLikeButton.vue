<template>
  <CommonVTooltip v-if="view.post.liked" content="이 게시글에 좋아요를 취소합니다">
    <Button variant="outline" class="cursor-pointer gap-2" @click="likePost(false)" :disabled="!isLoggedIn">
      <HeartIcon class="fill-current text-primary" />
      {{ num(view.post.like) }}
    </Button>
  </CommonVTooltip>

  <CommonVTooltip content="이 게시글에 좋아요를 남깁니다" v-else>
    <Button variant="outline" class="cursor-pointer gap-2" @click="likePost(true)" :disabled="!isLoggedIn">
      <HeartIcon />
      {{ view.post.like > 0 ? num(view.post.like) : "좋아요" }}
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { HeartIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { view, isLoggedIn, likePost } = useNuboViewContext()
</script>
