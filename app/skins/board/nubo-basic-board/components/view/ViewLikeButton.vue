<template>
  <CommonVTooltip content="이 게시글에 좋아요를 취소합니다" v-if="view.post.liked">
    <Button variant="outline" class="cursor-pointer" size="lg" @click="likePost(false)">
      <HeartIcon class="fill-red-300 text-red-300" />
    </Button>
  </CommonVTooltip>

  <CommonVTooltip content="이 게시글에 좋아요를 남깁니다" v-else>
    <Button variant="outline" class="cursor-pointer" size="lg" @click="likePost(true)">
      <HeartIcon class="text-red-300" />
    </Button>
  </CommonVTooltip>
</template>

<script setup lang="ts">
import { HeartIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/types/nubo-skin-keys"

const { view, likePost } = useNuboViewContext()
</script>
