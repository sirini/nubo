<template>
  <section class="container mx-auto py-4">
    <div>
      <div v-if="pending">Loading ...</div>
      <div v-else>
        <Card class="rounded-lg overflow-hidden shadow-lg pt-0" v-if="view">
          <img
            v-if="view.post.cover"
            :src="view.post.cover"
            alt="cover image"
            class="w-full object-cover"
          />
          <CardHeader class="px-3" :class="view.post.cover ? '' : 'pt-6'">
            <CardTitle class="line-clamp-1 mb-2 text-2xl font-heading">{{
              view.post.title
            }}</CardTitle>
            <CardDescription class="inline-flex items-center">
              <Heart
                :class="view.post.liked ? 'text-red-200 fill-current' : ''"
                class="w-3 h-3 mr-2"
              />
              {{ view.post.like }}
              <MessageCircle class="w-3 h-3 ml-4 mr-2" />
              {{ showReadableNumber(view.post.comment) }}
              <Eye class="w-3 h-3 ml-4 mr-2" />
              {{ showReadableNumber(view.post.hit) }}
              <span class="flex-1"></span>
              {{ showDateOnly(view.post.submitted) }}
            </CardDescription>
          </CardHeader>
          <CardContent class="leading-6 px-3 nubo">
            <div v-html="view.post.content" class="font-sans"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Eye, Heart, MessageCircle } from "lucide-vue-next"
import "~/assets/css/editor.scss"
import { useBoardView } from "~/composables/board/useBoardView"
import { showDateOnly, showReadableNumber } from "~/lib/utils"

const { data, pending } = await useBoardView()
const view = computed(() => data.value?.result)
</script>
