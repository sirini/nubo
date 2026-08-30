<template>
  <div class="space-y-5">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Card v-for="metric in metrics" :key="metric.label" class="border-stone-200/70 dark:border-stone-800">
        <CardContent class="space-y-2 p-4">
          <component :is="metric.icon" class="size-4 text-amber-700 dark:text-amber-400" />
          <div class="text-2xl font-semibold tabular-nums">{{ num(metric.value) }}</div>
          <div class="text-xs text-muted-foreground">{{ metric.label }}</div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader class="gap-4 border-b sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle class="text-lg">내 작품</CardTitle>
          <CardDescription>게시판을 선택해 작품별 반응을 살펴보세요.</CardDescription>
        </div>
        <Select :model-value="boardId" @update:model-value="changeBoard">
          <SelectTrigger class="w-full sm:w-56"><SelectValue placeholder="게시판 선택" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="board in profileBoards" :key="board.id" :value="board.id">{{ board.name }}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent class="space-y-5 p-4 sm:p-6">
        <div class="flex flex-wrap gap-2">
          <Button v-for="option in sortOptions" :key="option.value" size="sm" :variant="sort === option.value ? 'default' : 'outline'" class="cursor-pointer" @click="changeSort(option.value)">{{ option.label }}</Button>
        </div>

        <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton v-for="index in 6" :key="index" class="h-64 rounded-xl" />
        </div>

        <div v-else-if="error" class="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center text-sm text-destructive">
          {{ error }}
          <div class="mt-4"><Button variant="outline" size="sm" class="cursor-pointer" @click="refreshStudio">다시 시도</Button></div>
        </div>

        <div v-else-if="!boardId" class="rounded-xl border border-dashed px-4 py-14 text-center text-sm text-muted-foreground">조회할 수 있는 게시판이 없습니다.</div>

        <div v-else-if="!studio.posts.items.length" class="rounded-xl border border-dashed px-4 py-14 text-center">
          <ImagePlusIcon class="mx-auto mb-3 size-8 text-muted-foreground" />
          <p class="font-medium">아직 이 게시판에 작품이 없습니다.</p>
          <p class="mt-1 text-sm text-muted-foreground">첫 작품을 공유하면 반응이 이곳에 쌓입니다.</p>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink v-for="post in studio.posts.items" :key="post.uid" :to="`/board/${boardId}/${post.uid}`" class="group overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="aspect-4/3 overflow-hidden bg-muted">
              <img v-if="post.cover" :src="post.cover" :alt="recoverChars(post.title)" class="size-full object-cover transition duration-300 group-hover:scale-[1.02]" />
              <div v-else class="flex size-full items-center justify-center text-muted-foreground"><ImageIcon class="size-8" /></div>
            </div>
            <div class="space-y-3 p-4">
              <div class="flex items-start gap-2">
                <h3 class="min-w-0 flex-1 truncate font-medium">{{ recoverChars(post.title) }}</h3>
                <Badge v-if="post.status === STATUS.SECRET" variant="secondary" class="shrink-0 gap-1"><LockIcon class="size-3" />비밀</Badge>
              </div>
              <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span class="inline-flex items-center gap-1"><ImagesIcon class="size-3.5" />{{ post.imageCount }}</span>
                <span class="inline-flex items-center gap-1"><EyeIcon class="size-3.5" />{{ num(post.hit) }}</span>
                <span class="inline-flex items-center gap-1"><HeartIcon class="size-3.5" />{{ num(post.like) }}</span>
                <span class="inline-flex items-center gap-1"><MessageCircleIcon class="size-3.5" />{{ num(post.comment) }}</span>
                <span class="ml-auto">{{ date(post.submitted) }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-if="studio.posts.totalCount > studio.posts.limit" class="flex items-center justify-between border-t pt-4">
          <Button variant="outline" size="sm" class="cursor-pointer" :disabled="studio.posts.page <= 1 || isLoading" @click="changePage(studio.posts.page - 1)"><ChevronLeftIcon class="size-4" />이전</Button>
          <span class="text-xs text-muted-foreground">{{ studio.posts.page }} / {{ totalPages }} 페이지</span>
          <Button variant="outline" size="sm" class="cursor-pointer" :disabled="!studio.posts.hasNext || isLoading" @click="changePage(studio.posts.page + 1)">다음<ChevronRightIcon class="size-4" /></Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, HeartIcon, ImageIcon, ImagePlusIcon, ImagesIcon, LockIcon, MessageCircleIcon, NotepadTextIcon } from "lucide-vue-next"
import { STATUS, type BoardStudioResult, type BoardStudioSort } from "~/types/board"
import { useNuboProfileContext } from "~/providers/contexts/profile"

const EMPTY_STUDIO = (): BoardStudioResult => ({
  summary: { postCount: 0, photoCount: 0, viewCount: 0, likeCount: 0, commentCount: 0 },
  posts: { page: 1, limit: 12, totalCount: 0, hasNext: false, items: [] },
})

const { isMe, loadMyStudio, profileBoards } = useNuboProfileContext()
const boardId = ref("")
const sort = ref<BoardStudioSort>("recent")
const page = ref(1)
const studio = ref<BoardStudioResult>(EMPTY_STUDIO())
const isLoading = ref(false)
const error = ref("")
let requestSequence = 0

const sortOptions: { label: string, value: BoardStudioSort }[] = [
  { label: "최근", value: "recent" },
  { label: "조회", value: "views" },
  { label: "좋아요", value: "likes" },
  { label: "댓글", value: "comments" },
]

const metrics = computed(() => [
  { label: "작품", value: studio.value.summary.postCount, icon: NotepadTextIcon },
  { label: "사진", value: studio.value.summary.photoCount, icon: ImagesIcon },
  { label: "누적 조회", value: studio.value.summary.viewCount, icon: EyeIcon },
  { label: "받은 좋아요", value: studio.value.summary.likeCount, icon: HeartIcon },
  { label: "받은 댓글", value: studio.value.summary.commentCount, icon: MessageCircleIcon },
])
const totalPages = computed(() => Math.max(1, Math.ceil(studio.value.posts.totalCount / studio.value.posts.limit)))

const refreshStudio = async () => {
  if (!isMe.value || !boardId.value) return
  const sequence = ++requestSequence
  isLoading.value = true
  error.value = ""
  try {
    const response = await loadMyStudio({ id: boardId.value, page: page.value, limit: 12, sort: sort.value })
    if (sequence !== requestSequence) return
    if (!response.success) {
      error.value = response.error || "작품 통계를 불러오지 못했습니다."
      return
    }
    studio.value = response.result
  } catch {
    if (sequence === requestSequence) error.value = "작품 통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
  } finally {
    if (sequence === requestSequence) isLoading.value = false
  }
}

const changeBoard = (value: unknown) => {
  if (typeof value !== "string" || value === boardId.value) return
  boardId.value = value
  page.value = 1
}
const changeSort = (value: BoardStudioSort) => {
  if (value === sort.value) return
  sort.value = value
  page.value = 1
}
const changePage = (value: number) => {
  if (value < 1 || value === page.value) return
  page.value = value
}

watch(profileBoards, (boards) => {
  if (boardId.value || !boards.length) return
  boardId.value = boards.find((board) => board.id === "photo")?.id || boards[0]?.id || ""
}, { immediate: true })
watch([boardId, sort, page], refreshStudio, { immediate: true })
</script>
