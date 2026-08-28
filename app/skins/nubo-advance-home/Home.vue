<template>
  <section class="min-h-[calc(100dvh-65px)] bg-surface-subtle/35">
    <div class="mx-auto w-full max-w-[1420px] px-3 py-5 sm:px-5 lg:py-7">
      <header class="mb-5 overflow-hidden rounded-2xl border border-border/70 bg-card/92 shadow-sm">
        <div class="border-b border-border/60 px-4 py-5 sm:px-6 sm:py-6">
          <div class="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {{ isSearching ? "Search" : "Front page" }}
              </p>
              <h1 class="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                {{ isSearching ? `‘${keyword}’ 검색 결과` : "커뮤니티의 지금" }}
              </h1>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                <template v-if="isSearching">
                  {{ searchOptionLabel }} 기준으로 모든 게시판에서 찾은 글입니다.
                </template>
                <template v-else>
                  사진, 글, 질문과 답변을 하나의 피드에서 발견하고 이야기에 참여해 보세요.
                </template>
              </p>
            </div>

            <Button v-if="isLoggedIn && firstBoardId" class="shrink-0 gap-2" as-child>
              <NuxtLink :to="`/board/${firstBoardId}/write`">
                <PlusIcon class="size-4" /> 새 글 쓰기
              </NuxtLink>
            </Button>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-5">
          <Button
            size="sm"
            :variant="viewMode === 'all' ? 'secondary' : 'ghost'"
            class="gap-2"
            @click="viewMode = 'all'"
          >
            <FlameIcon class="size-4" /> 최신
          </Button>
          <Button
            size="sm"
            :variant="viewMode === 'media' ? 'secondary' : 'ghost'"
            class="gap-2"
            @click="viewMode = 'media'"
          >
            <ImageIcon class="size-4" /> 미디어
          </Button>
          <Button
            size="sm"
            variant="ghost"
            class="gap-2"
            :disabled="refreshing"
            @click="refresh"
          >
            <RefreshCwIcon class="size-4" :class="refreshing ? 'animate-spin' : ''" /> 새로고침
          </Button>
          <span class="ml-auto px-2 text-xs text-muted-foreground">
            {{ visiblePosts.length }}건
          </span>
        </div>
      </header>

      <div class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,780px)_300px] xl:justify-center">
        <main class="min-w-0">
          <div v-if="visiblePosts.length" class="space-y-3">
            <AdvanceHomeFeedCard
              v-for="post in visiblePosts"
              :key="`${post.id}-${post.uid}`"
              :post="post"
              :board-name="boardNames.get(post.id) || post.id"
              @open-media="openMedia"
              @toggle-like="toggleLike"
            />
          </div>

          <div
            v-else
            class="rounded-2xl border border-dashed border-border bg-card/70 px-5 py-16 text-center"
          >
            <InboxIcon class="mx-auto size-9 text-muted-foreground/55" />
            <h2 class="mt-4 font-semibold">
              {{ viewMode === "media" ? "미디어가 포함된 글이 없습니다" : "표시할 글이 없습니다" }}
            </h2>
            <p class="mt-2 text-sm text-muted-foreground">
              다른 보기 방식을 선택하거나 새로고침해 보세요.
            </p>
          </div>

          <Button
            v-if="!isLastPost"
            variant="outline"
            size="lg"
            class="mt-4 w-full gap-2 bg-card"
            :disabled="loadingMore"
            @click="loadMore"
          >
            <LoaderCircleIcon v-if="loadingMore" class="size-4 animate-spin" />
            <ArrowDownToLineIcon v-else class="size-4" />
            {{ loadingMore ? "불러오는 중" : "이전 글 더 보기" }}
          </Button>

          <div
            v-else-if="posts.length"
            class="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/65 p-3 text-sm text-muted-foreground"
          >
            <CheckCircle2Icon class="size-4" /> 모든 게시글을 불러왔습니다.
          </div>
        </main>

        <AdvanceHomeRail
          :menus="menus"
          :posts="posts"
          :first-board-id="firstBoardId"
          :is-logged-in="isLoggedIn"
        />
      </div>
    </div>

    <AdvanceHomeMediaViewer
      v-model:index="selectedMediaIndex"
      :open="selectedMediaIndex >= 0"
      :posts="mediaPosts"
      @close="selectedMediaIndex = -1"
    />
  </section>
</template>

<script setup lang="ts">
import {
  ArrowDownToLineIcon,
  CheckCircle2Icon,
  FlameIcon,
  ImageIcon,
  InboxIcon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-vue-next"
import { useNuboHomeContext } from "~/providers/contexts/home"
import { SEARCH } from "~/types/board"
import type { HomePostItem } from "~/types/home"
import AdvanceHomeFeedCard from "./components/AdvanceHomeFeedCard.vue"
import AdvanceHomeMediaViewer from "./components/AdvanceHomeMediaViewer.vue"
import AdvanceHomeRail from "./components/AdvanceHomeRail.vue"

defineOptions({ name: "NuboAdvanceHome" })

const route = useRoute()
const {
  isLastPost,
  isLoggedIn,
  keyword,
  loadMorePosts,
  menus,
  option,
  optionLabels,
  posts,
  reloadPosts,
  toggleLike,
} = useNuboHomeContext()
const viewMode = ref<"all" | "media">("all")
const loadingMore = ref(false)
const refreshing = ref(false)
const selectedMediaIndex = ref(-1)

const isSearching = computed(
  () => route.params.keyword !== undefined && String(route.params.keyword).length > 1,
)
const boardNames = computed(
  () =>
    new Map(
      menus.value.flatMap((group) => group.boards.map((board) => [board.id, board.name] as const)),
    ),
)
const firstBoardId = computed(
  () => menus.value.flatMap((group) => group.boards)[0]?.id || posts.value[0]?.id || "",
)
const searchOptionLabel = computed(
  () =>
    ({
      [SEARCH.TITLE]: "제목",
      [SEARCH.CONTENT]: "본문",
      [SEARCH.WRITER]: "작성자",
      [SEARCH.TAG]: "해시태그",
      [SEARCH.IMAGEDESC]: "이미지 설명",
    })[option.value] || optionLabels.value[option.value] || "제목",
)
const mediaPosts = computed(() => posts.value.filter((post) => Boolean(post.cover)))
const visiblePosts = computed(() =>
  viewMode.value === "media" ? mediaPosts.value : posts.value,
)

const refresh = async () => {
  refreshing.value = true
  selectedMediaIndex.value = -1
  try {
    await reloadPosts()
  } finally {
    refreshing.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  try {
    await loadMorePosts()
  } finally {
    loadingMore.value = false
  }
}

const openMedia = (post: HomePostItem) => {
  selectedMediaIndex.value = mediaPosts.value.findIndex(
    (candidate) => candidate.uid === post.uid && candidate.id === post.id,
  )
}
</script>
