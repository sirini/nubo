<template>
  <Card
    v-for="post in posts"
    :key="post.uid"
    class="group grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-none shadow-none"
  >
    <NuxtLink
      :to="`/board/${config.id}/${post.uid}`"
      class="block md:col-span-4 overflow-hidden rounded-lg bg-muted aspect-square shadow-sm relative"
    >
      <img
        :src="post.cover"
        :alt="post.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div
        class="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-md border border-white/20 shadow-sm text-foreground transition-transform duration-300 group-hover:scale-110"
      >
        <HeartIcon class="w-4 h-4 text-red-400" :class="post.liked ? 'fill-current' : ''" />
        <span class="text-sm font-bold">{{ num(post.like) }}</span>
      </div>

      <Badge
        v-if="config.useCategory"
        variant="secondary"
        class="absolute top-4 left-4 backdrop-blur-md bg-background/50 text-sm"
      >
        {{ recoverChars(post.category.name) }}
      </Badge>
    </NuxtLink>

    <div class="md:col-span-8 flex flex-col justify-center space-y-4">
      <CardHeader class="px-0">
        <CardDescription class="flex items-center gap-3 text-sm text-muted-foreground">
          <span class="flex items-center gap-1">
            <CalendarIcon class="w-4 h-4" /> {{ date(post.submitted) }}
          </span>
          <Separator orientation="vertical" class="h-3" />
          <span class="flex items-center gap-1">
            <ClockIcon class="w-4 h-4" /> {{ getReadingTime(post.content) }} min read
          </span>
        </CardDescription>

        <NuxtLink
          :to="`/board/${config.id}/${post.uid}`"
          class="block group-hover:text-primary transition-colors duration-300"
          as-child
        >
          <CardTitle class="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            {{ recoverChars(post.title) }}
          </CardTitle>
        </NuxtLink>
      </CardHeader>

      <CardContent
        class="text-lg text-muted-foreground leading-relaxed line-clamp-3 md:line-clamp-4 p-0"
      >
        {{ stripTags(post.content) }}
      </CardContent>

      <CardFooter class="px-0 flex items-center justify-between">
        <div class="pt-4 flex items-center gap-3">
          <Avatar class="w-8 h-8 border shadow-sm">
            <AvatarImage :src="post.writer.profile" />
            <AvatarFallback>{{ post.writer.name.slice(0, 2) }}</AvatarFallback>
          </Avatar>
          <span class="text-sm font-medium text-foreground">{{
            recoverChars(post.writer.name)
          }}</span>
        </div>

        <NuxtLink
          :to="`/board/${config.id}/${post.uid}`"
          class="text-sm font-bold flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          읽어 보기 <ArrowRightIcon class="w-4 h-4" />
        </NuxtLink>
      </CardFooter>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ArrowRightIcon, CalendarIcon, ClockIcon, HeartIcon } from "lucide-vue-next"
import { useNuboListContext } from "~/types/nubo-skin-keys"

const { config, posts } = useNuboListContext()
</script>
