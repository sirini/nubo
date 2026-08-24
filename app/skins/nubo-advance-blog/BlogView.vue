<template>
  <article class="min-h-screen">
    <ClientOnly>
      <Teleport to="body">
        <div
          id="advance-blog-progress"
          class="pointer-events-none fixed inset-x-0 top-0 z-[110] h-0.5 origin-left bg-primary"
          aria-hidden="true"
        ></div>
      </Teleport>
    </ClientOnly>

    <header class="mx-auto max-w-3xl px-4 pb-9 pt-12 sm:px-6 sm:pt-18">
      <NuxtLink
        :to="`/board/${config.id}/page/1`"
        class="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
        ><ArrowLeftIcon class="size-3.5" />{{ recoverChars(config.name) }}</NuxtLink
      >
      <Badge
        v-if="config.useCategory && view.post.category.name"
        variant="secondary"
        class="ml-3"
        >{{ recoverChars(view.post.category.name) }}</Badge
      >
      <h1
        class="mt-6 break-keep text-4xl font-semibold leading-[1.12] tracking-[-0.055em] sm:text-6xl"
      >
        {{ recoverChars(view.post.title) }}
      </h1>
      <p class="mt-6 line-clamp-2 text-lg leading-8 text-muted-foreground">{{ description }}</p>
      <div class="mt-8 flex flex-wrap items-center justify-between gap-5">
        <div class="flex items-center gap-3">
          <Avatar class="size-11 border border-border/70"
            ><AvatarImage
              :src="view.post.writer.profile"
              :alt="recoverChars(view.post.writer.name)"
            /><AvatarFallback>{{
              recoverChars(view.post.writer.name).slice(0, 2)
            }}</AvatarFallback></Avatar
          >
          <div>
            <NuxtLink
              :to="`/user/${view.post.writer.uid}`"
              class="text-sm font-semibold hover:text-primary"
              >{{ recoverChars(view.post.writer.name) }}</NuxtLink
            >
            <p class="mt-1 text-xs text-muted-foreground">
              {{ date(view.post.submitted) }} · {{ getReadingTime(view.post.content) }}분 읽기 ·
              조회 {{ num(view.post.hit) }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            :disabled="!isLoggedIn"
            :aria-label="view.post.liked ? '좋아요 취소' : '좋아요'"
            @click="likePost(!view.post.liked)"
            ><HeartIcon
              class="size-4"
              :class="view.post.liked ? 'fill-current text-primary' : ''" /></Button
          ><span class="text-xs text-muted-foreground">{{ num(view.post.like) }}</span>
        </div>
      </div>
    </header>

    <figure v-if="coverImage" class="mx-auto max-w-6xl px-4 sm:px-6">
      <img
        :src="coverImage"
        :alt="recoverChars(view.post.title)"
        class="max-h-[75dvh] w-full rounded-2xl bg-media object-cover"
      />
    </figure>

    <div
      class="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[8rem_minmax(0,45rem)_minmax(10rem,1fr)] lg:py-16"
    >
      <aside class="hidden lg:block">
        <div class="sticky top-28 flex flex-col items-start gap-2">
          <Button
            variant="ghost"
            size="sm"
            class="gap-2"
            :disabled="!isLoggedIn"
            @click="likePost(!view.post.liked)"
            ><HeartIcon
              class="size-4"
              :class="view.post.liked ? 'fill-current text-primary' : ''"
            />{{ num(view.post.like) }}</Button
          ><a
            href="#advance-blog-comments"
            class="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            ><MessageCircleIcon class="size-4" />{{ num(view.post.comment) }}</a
          >
        </div>
      </aside>

      <main class="min-w-0">
        <AdvanceBlogContent :content="view.post.content" />
        <div v-if="view.tags.length" class="mt-12 flex flex-wrap gap-2">
          <Badge v-for="tag in view.tags" :key="tag.uid" variant="secondary"
            >#{{ recoverChars(tag.name) }}</Badge
          >
        </div>

        <section class="mt-12 rounded-2xl border border-border/60 bg-muted/15 p-5 sm:p-7">
          <div class="flex items-center gap-4">
            <Avatar class="size-14 border border-border/70"
              ><AvatarImage
                :src="view.post.writer.profile"
                :alt="recoverChars(view.post.writer.name)"
              /><AvatarFallback>{{
                recoverChars(view.post.writer.name).slice(0, 2)
              }}</AvatarFallback></Avatar
            >
            <div>
              <p class="text-xs text-muted-foreground">이 글을 쓴 사람</p>
              <NuxtLink
                :to="`/user/${view.post.writer.uid}`"
                class="mt-1 block font-semibold hover:text-primary"
                >{{ recoverChars(view.post.writer.name) }}</NuxtLink
              >
            </div>
          </div>
          <p v-if="view.post.writer.signature" class="mt-5 text-sm leading-7 text-muted-foreground">
            {{ recoverChars(view.post.writer.signature) }}
          </p>
        </section>

        <section v-if="view.files.length" class="mt-10 border-t border-border/60 pt-8">
          <h2 class="text-sm font-semibold">첨부파일</h2>
          <div class="mt-3 flex flex-wrap gap-2">
            <Button
              v-for="file in view.files"
              :key="file.uid"
              variant="outline"
              size="sm"
              class="gap-2"
              @click="downloadFile(file.uid)"
              ><PaperclipIcon class="size-3.5" />{{ recoverChars(file.name) }}</Button
            >
          </div>
        </section>
      </main>

      <AdvanceBlogToc />
    </div>

    <section
      v-if="view.writerPosts.length"
      class="mx-auto max-w-3xl border-t border-border/60 px-4 py-10 sm:px-6"
    >
      <h2 class="text-lg font-semibold">작성자의 다른 글</h2>
      <div class="mt-5 divide-y divide-border/60">
        <NuxtLink
          v-for="post in view.writerPosts.slice(0, 3)"
          :key="`${post.board.id}-${post.postUid}`"
          :to="`/board/${post.board.id}/${post.postUid}`"
          class="flex items-center justify-between gap-4 py-4 hover:text-primary"
          ><span class="line-clamp-1 font-medium">{{ recoverChars(post.title) }}</span
          ><span class="shrink-0 text-xs text-muted-foreground">{{
            date(post.submitted)
          }}</span></NuxtLink
        >
      </div>
    </section>

    <AdvanceBlogComments id="advance-blog-comments" />

    <footer
      class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-10 sm:px-6"
    >
      <Button variant="ghost" as-child
        ><NuxtLink :to="`/board/${config.id}/page/1`">목록으로</NuxtLink></Button
      >
      <div class="flex gap-2">
        <Button v-if="isWriter || isAdmin" variant="outline" as-child
          ><NuxtLink :to="`/board/${config.id}/${view.post.uid}/edit`">수정</NuxtLink></Button
        ><Button v-if="isLoggedIn" as-child
          ><NuxtLink :to="`/board/${config.id}/write`">새 글 쓰기</NuxtLink></Button
        >
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, HeartIcon, MessageCircleIcon, PaperclipIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"
import AdvanceBlogComments from "./components/AdvanceBlogComments.vue"
import AdvanceBlogContent from "./components/AdvanceBlogContent.vue"
import AdvanceBlogToc from "./components/AdvanceBlogToc.vue"

const {
  clearReadingProgress,
  config,
  downloadFile,
  isAdmin,
  isLoggedIn,
  isWriter,
  likePost,
  updateReadingProgress,
  view,
} = useNuboViewContext()
const coverImage = computed(() =>
  getPreviewImage(view.value.images[0]?.thumbnail.large || view.value.post.cover),
)
const description = computed(() =>
  recoverChars(stripTags(view.value.post.content)).replace(/\s+/g, " ").trim().slice(0, 180),
)
onMounted(() => updateReadingProgress("advance-blog-progress"))
onBeforeUnmount(() => clearReadingProgress())
</script>
