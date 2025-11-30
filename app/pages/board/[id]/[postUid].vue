<template>
  <section class="container mx-auto py-4">
    <div v-if="board.pending">Loading ...</div>
    <div v-else-if="board.view" class="mx-auto" :style="`max-width: ${board.view.config.width}px`">
      <BoardViewBreadcrumb :config="board.view.config" />
      <Card
        class="rounded-lg overflow-hidden shadow-lg pt-0 mb-4"
        :style="`max-width: ${board.view.config.width}px`"
      >
        <BoardViewImageCarousel :images="board.view.images" v-if="board.view.images.length > 0" />

        <Collapsible
          v-if="board.view.files.length > 0"
          v-model:open="board.isFileListOpen"
          class="p-3 border rounded-md mx-3"
        >
          <div class="flex items-center justify-between w-full px-1 cursor-pointer">
            <h4 class="text-sm font-semibold" @click="board.isFileListOpen = !board.isFileListOpen">
              첨부파일 목록
            </h4>
            <CollapsibleTrigger as-child>
              <Button variant="ghost" size="sm" class="p-0 cursor-pointer">
                <ChevronsUpDown class="h-4 w-4" />
                <span class="sr-only">토글</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent class="pt-2 space-y-2">
            <div
              v-for="(file, index) in board.view.files"
              :key="index"
              class="rounded-md border px-4 py-3 font-code text-sm inline-flex items-center w-full cursor-pointer"
            >
              <Download class="w-4 h-4 mr-3" />
              <span class="text-xs">{{ file.name }}</span>
              <span class="flex-1"></span>
              <span class="text-xs">{{ num(file.size) }}B</span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <CardHeader class="px-3">
          <CardTitle class="line-clamp-1 my-2 text-2xl font-title px-1">{{
            board.view.post.title
          }}</CardTitle>
          <CardDescription class="inline-flex items-center px-1 font-code">
            <Heart
              :class="board.view.post.liked ? 'text-red-500 fill-current' : ''"
              class="w-3 h-3 mr-2"
            />
            {{ board.view.post.like }}
            <MessageCircle class="w-3 h-3 ml-4 mr-2" />
            {{ num(board.view.post.comment) }}
            <Eye class="w-3 h-3 ml-4 mr-2" />
            {{ num(board.view.post.hit) }}
            <span class="flex-1"></span>
            {{ showDateOnly(board.view.post.submitted) }}
          </CardDescription>
        </CardHeader>
        <CardContent class="leading-7 px-4 nubo">
          <div v-html="board.view.post.content"></div>
        </CardContent>
        <CardFooter class="px-4 justify-between">
          <div>
            <Badge
              v-for="(tag, index) in board.view.tags"
              :key="index"
              variant="secondary"
              class="mt-2 mr-2"
            >
              <Hash />
              {{ tag.name }}</Badge
            >
          </div>
          <div class="flex items-center text-center">
            <CommonVTooltip content="이 게시글에 좋아요를 취소합니다" v-if="board.view.post.liked">
              <Button variant="outline" class="cursor-pointer" size="lg">
                <HeartIcon class="fill-red-500" />
              </Button>
            </CommonVTooltip>

            <CommonVTooltip content="이 게시글에 좋아요를 남깁니다" v-else>
              <Button variant="outline" class="cursor-pointer" size="lg">
                <HeartIcon class="text-red-500" />
              </Button>
            </CommonVTooltip>
          </div>
        </CardFooter>

        <div v-if="board.view.post.writer.signature.length > 0">
          <hr />
          <div class="text-secondary text-sm pt-3 px-4">
            {{ stripTags(board.view.post.writer.signature) }}
          </div>
        </div>
      </Card>

      <BoardViewWriteComment :config="board.view.config" />

      <div class="flex items-center justify-between mt-6">
        <CommonVTooltip content="목록 페이지로 돌아갑니다">
          <Button as-child variant="outline">
            <NuxtLink :to="`/board/${boardId}`">목록보기</NuxtLink></Button
          >
        </CommonVTooltip>

        <div class="inline-flex gap-3 items-center">
          <CommonVTooltip
            content="본인이 작성하신 게시글을 수정합니다"
            v-if="auth.user.uid === board.view.post.writer.uid"
          >
            <Button as-child variant="outline">
              <NuxtLink :to="`/board/${boardId}/modify/${postUid}`">수정하기</NuxtLink>
            </Button>
          </CommonVTooltip>

          <CommonVTooltip content="새로운 글을 작성합니다">
            <Button
              as-child
              variant="default"
              class="text-foreground"
              :class="{ 'opacity-50 pointer-events-none': !auth.isLoggedIn }"
            >
              <NuxtLink :to="`/board/${boardId}/write`" :aria-disabled="!auth.isLoggedIn"
                >새글작성</NuxtLink
              >
            </Button>
          </CommonVTooltip>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ChevronsUpDown,
  Download,
  Eye,
  Hash,
  Heart,
  HeartIcon,
  MessageCircle,
} from "lucide-vue-next"
import "~/assets/css/editor.scss"
import { showDateOnly, num, stripTags } from "~/lib/utils"

const route = useRoute()
const board = useBoardStore()
const auth = useAuthStore()
const boardId = route.params.id as string
const postUid = parseInt(route.params.postUid as string, 10)

await board.fetchView(boardId, postUid)

watch(
  () => route.params,
  async (newParams) => {
    await board.fetchView(newParams.id as string, parseInt(newParams.postUid as string, 10))
  },
)
</script>
