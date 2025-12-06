<template>
  <CommonVTooltip content="이 게시글에 좋아요를 취소합니다" v-if="board.view.post.liked">
    <Button variant="outline" class="cursor-pointer" size="lg" @click="toggle(false)">
      <HeartIcon class="fill-red-300 text-red-300" />
    </Button>
  </CommonVTooltip>

  <CommonVTooltip content="이 게시글에 좋아요를 남깁니다" v-else>
    <Button variant="outline" class="cursor-pointer" size="lg" @click="toggle(true)">
      <HeartIcon class="text-red-300" />
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { HeartIcon } from "lucide-vue-next"

const board = useBoardStore()
const auth = useAuthStore()

const toggle = async (isLiked: boolean) => {
  if (!auth.isLoggedIn) {
    return navigateTo(`/auth/login?redirect=/board/${board.view.config.id}/${board.view.post.uid}`)
  }
  await board.togglePostLike(isLiked)
  board.view.post.liked = isLiked
}
</script>
