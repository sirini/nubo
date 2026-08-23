<template>
  <article class="min-h-[calc(100dvh-65px)] bg-background">
    <section class="grid min-h-[62vh] bg-media lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="relative flex min-h-[58vh] items-center justify-center overflow-hidden p-3 sm:p-6 lg:min-h-[calc(100dvh-65px)]">
        <button
          type="button"
          class="group flex h-full w-full cursor-zoom-in items-center justify-center"
          :disabled="!previewSource"
          aria-label="원본 이미지를 전체 화면으로 보기"
          @click="openOriginal"
        >
          <img
            v-if="previewSource"
            :src="previewSource"
            :alt="currentAlt"
            class="max-h-[calc(100dvh-8rem)] max-w-full select-none object-contain transition duration-300 group-hover:brightness-95"
          />
          <span v-else class="text-sm text-media-foreground/55">이미지가 없습니다</span>
        </button>

        <div v-if="view.images.length > 1" class="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between sm:inset-x-6">
          <Button variant="secondary" size="icon" class="rounded-full bg-background/75 backdrop-blur" :disabled="imgIdx <= 0" aria-label="이전 사진" @click="previous(false)">
            <ChevronLeftIcon class="size-5" />
          </Button>
          <Button variant="secondary" size="icon" class="rounded-full bg-background/75 backdrop-blur" :disabled="imgIdx >= view.images.length - 1" aria-label="다음 사진" @click="next(false)">
            <ChevronRightIcon class="size-5" />
          </Button>
        </div>

        <div v-if="view.images.length > 1" class="absolute bottom-5 left-1/2 rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur">
          {{ imgIdx + 1 }} / {{ view.images.length }}
        </div>
      </div>

      <aside class="border-l border-border/60 bg-background/96 p-5 sm:p-7">
        <div class="sticky top-20 space-y-7">
          <div>
            <p v-if="config.useCategory && view.post.category.name" class="mb-2 text-xs font-semibold text-primary">
              {{ recoverChars(view.post.category.name) }}
            </p>
            <h1 class="text-2xl font-semibold leading-tight tracking-[-0.035em]">{{ recoverChars(view.post.title) }}</h1>
            <p class="mt-3 text-xs text-muted-foreground">{{ dateFull(view.post.submitted) }} · 조회 {{ num(view.post.hit) }}</p>
          </div>

          <div class="flex items-center gap-3">
            <Avatar class="size-11 border border-border/70">
              <AvatarImage :src="view.post.writer.profile" :alt="recoverChars(view.post.writer.name)" />
              <AvatarFallback>{{ recoverChars(view.post.writer.name).charAt(0) }}</AvatarFallback>
            </Avatar>
            <div class="min-w-0">
              <NuxtLink :to="`/user/${view.post.writer.uid}`" class="font-semibold hover:text-primary">{{ recoverChars(view.post.writer.name) }}</NuxtLink>
              <p class="mt-1 truncate text-xs text-muted-foreground">{{ recoverChars(view.post.writer.signature) }}</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button variant="outline" class="gap-2" :disabled="!isLoggedIn" @click="likePost(!view.post.liked)">
              <HeartIcon class="size-4" :class="view.post.liked ? 'fill-current text-primary' : ''" /> {{ num(view.post.like) }}
            </Button>
            <Button variant="outline" class="gap-2" :disabled="!currentImage" @click="openOriginal">
              <Maximize2Icon class="size-4" /> 원본 보기
            </Button>
          </div>

          <div v-if="currentImage?.exif.make" class="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border/60 py-5 font-mono text-xs text-muted-foreground">
            <span>{{ currentImage.exif.make }} {{ currentImage.exif.model }}</span>
            <span>{{ currentImage.exif.focalLength || "?" }}mm</span>
            <span>f/{{ (currentImage.exif.aperture || 0) / 100 }}</span>
            <span>ISO {{ currentImage.exif.iso || 0 }}</span>
          </div>

          <div class="nubo text-sm leading-7 text-foreground/90">
            <!-- eslint-disable-next-line vue/no-v-html -- 게시글 HTML은 provider에서 정제된 값을 사용합니다. -->
            <div v-html="sanitize(view.post.content)"></div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Badge v-for="tag in view.tags" :key="tag.uid" variant="secondary">#{{ recoverChars(tag.name) }}</Badge>
          </div>

          <div class="flex flex-wrap justify-between gap-2 border-t border-border/60 pt-5">
            <Button variant="ghost" as-child><NuxtLink :to="`/board/${config.id}/page/1`">목록</NuxtLink></Button>
            <div class="flex gap-2">
              <Button v-if="isWriter || isAdmin" variant="outline" as-child><NuxtLink :to="`/board/${config.id}/${view.post.uid}/modify`">수정</NuxtLink></Button>
              <Button v-if="isLoggedIn" as-child><NuxtLink :to="`/board/${config.id}/write`">사진 올리기</NuxtLink></Button>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <section class="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h2 class="mb-6 text-xl font-semibold tracking-tight">댓글 {{ num(view.post.comment) }}</h2>
      <div v-if="comments.length" class="divide-y divide-border/60">
        <article v-for="comment in comments" :key="comment.uid" class="flex gap-3 py-5" :class="comment.uid !== comment.replyUid ? 'pl-6' : ''">
          <Avatar class="size-9 shrink-0"><AvatarImage :src="comment.writer.profile" /><AvatarFallback>{{ comment.writer.name.charAt(0) }}</AvatarFallback></Avatar>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-3"><strong class="text-sm">{{ comment.writer.name }}</strong><span class="text-xs text-muted-foreground">{{ dateFull(comment.submitted) }}</span></div>
            <p class="mt-2 whitespace-pre-wrap text-sm leading-7">{{ stripTags(comment.content) }}</p>
            <Button variant="ghost" size="sm" class="mt-2 gap-1" :disabled="!isLoggedIn" @click="likeComment(comment.uid, !comment.liked)"><HeartIcon class="size-3.5" :class="comment.liked ? 'fill-current text-primary' : ''" />{{ comment.like || '좋아요' }}</Button>
          </div>
        </article>
      </div>
      <p v-else class="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
    </section>

    <ClientOnly>
      <Teleport to="body">
        <div v-if="viewerOpen" class="fixed inset-0 z-[100] flex bg-black/96 text-white" role="dialog" aria-modal="true" aria-label="원본 이미지 뷰어" @click.self="closeViewer">
          <div class="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-linear-to-b from-black/75 to-transparent p-3 sm:p-5">
            <div class="min-w-0"><p class="truncate text-sm font-medium">{{ recoverChars(view.post.title) }}</p><p class="mt-1 text-xs text-white/60">{{ imgIdx + 1 }} / {{ Math.max(1, view.images.length) }}</p></div>
            <div class="flex gap-2">
              <Button variant="secondary" size="sm" class="gap-2 bg-white/12 text-white hover:bg-white/20" @click="fitToScreen = !fitToScreen"><ScanIcon class="size-4" />{{ fitToScreen ? '1:1' : '화면 맞춤' }}</Button>
              <Button variant="secondary" size="icon" class="bg-white/12 text-white hover:bg-white/20" aria-label="전체 화면 닫기" @click="closeViewer"><XIcon class="size-5" /></Button>
            </div>
          </div>

          <div class="flex h-full w-full items-center justify-center overflow-auto p-4 pt-20" :class="fitToScreen ? '' : 'cursor-zoom-out'" @click.self="closeViewer">
            <div v-if="originalLoading" class="flex flex-col items-center gap-3 text-sm text-white/70"><LoaderCircleIcon class="size-7 animate-spin" />원본 이미지를 불러오는 중입니다</div>
            <div v-else-if="originalError" class="max-w-sm rounded-xl border border-white/15 bg-white/10 p-5 text-center text-sm"><p>{{ originalError }}</p><Button variant="secondary" class="mt-4" @click="loadOriginal">다시 시도</Button></div>
            <img v-else-if="originalUrl" :src="originalUrl" :alt="currentAlt" draggable="false" class="select-none [touch-action:pinch-zoom]" :class="fitToScreen ? 'max-h-full max-w-full cursor-zoom-in object-contain' : 'max-h-[none] max-w-[none] cursor-zoom-out'" @click.stop="fitToScreen = !fitToScreen" />
          </div>

          <Button v-if="view.images.length > 1" variant="secondary" size="icon" class="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/12 text-white hover:bg-white/20 sm:left-6" :disabled="imgIdx <= 0" aria-label="이전 원본 사진" @click="previous(true)"><ChevronLeftIcon class="size-6" /></Button>
          <Button v-if="view.images.length > 1" variant="secondary" size="icon" class="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/12 text-white hover:bg-white/20 sm:right-6" :disabled="imgIdx >= view.images.length - 1" aria-label="다음 원본 사진" @click="next(true)"><ChevronRightIcon class="size-6" /></Button>
        </div>
      </Teleport>
    </ClientOnly>
  </article>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon, LoaderCircleIcon, Maximize2Icon, ScanIcon, XIcon } from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"

const { comments, config, imgIdx, isAdmin, isLoggedIn, isWriter, likeComment, likePost, originalImageUrl, view } = useNuboViewContext()
const { sanitize } = useSanitize()
const viewerOpen = ref(false)
const fitToScreen = ref(true)
const originalLoading = ref(false)
const originalUrl = ref("")
const originalError = ref("")
let requestSequence = 0

const currentImage = computed(() => view.value.images[imgIdx.value])
const previewSource = computed(() => currentImage.value ? getPreviewImage(currentImage.value.thumbnail.large) : getPreviewImage(view.value.post.cover))
const currentAlt = computed(() => `${recoverChars(view.value.post.title)} 이미지 ${imgIdx.value + 1}`)

const loadOriginal = async () => {
  const fileUid = currentImage.value?.file.uid
  if (!fileUid) {
    originalError.value = "이 사진의 원본 파일을 찾을 수 없습니다."
    return
  }
  const sequence = ++requestSequence
  originalLoading.value = true
  originalError.value = ""
  originalUrl.value = ""
  try {
    const url = await originalImageUrl(fileUid)
    if (sequence === requestSequence) originalUrl.value = url
  } catch (error) {
    if (sequence === requestSequence) originalError.value = error instanceof Error ? error.message : "원본 이미지를 불러오지 못했습니다."
  } finally {
    if (sequence === requestSequence) originalLoading.value = false
  }
}

const openOriginal = async () => {
  if (!previewSource.value) return
  viewerOpen.value = true
  fitToScreen.value = true
  await loadOriginal()
}
const closeViewer = () => { viewerOpen.value = false; requestSequence++; originalUrl.value = "" }
const previous = async (reload: boolean) => { if (imgIdx.value > 0) { imgIdx.value--; if (reload) await loadOriginal() } }
const next = async (reload: boolean) => { if (imgIdx.value < view.value.images.length - 1) { imgIdx.value++; if (reload) await loadOriginal() } }
const onKeydown = (event: KeyboardEvent) => {
  if (!viewerOpen.value) return
  if (event.key === "Escape") closeViewer()
  if (event.key === "ArrowLeft") void previous(true)
  if (event.key === "ArrowRight") void next(true)
}

watch(viewerOpen, (open) => { document.body.style.overflow = open ? "hidden" : "" })
onMounted(() => window.addEventListener("keydown", onKeydown))
onBeforeUnmount(() => { window.removeEventListener("keydown", onKeydown); document.body.style.overflow = "" })
</script>
