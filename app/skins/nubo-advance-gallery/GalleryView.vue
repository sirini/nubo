<template>
  <article class="min-h-[calc(100dvh-65px)] bg-background">
    <section class="grid min-h-[62vh] bg-media lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div
        class="relative flex min-h-[58vh] items-center justify-center overflow-hidden p-3 sm:p-6 lg:min-h-[calc(100dvh-65px)]"
      >
        <button
          ref="previewButton"
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

        <div
          v-if="view.images.length > 1"
          class="pointer-events-none absolute inset-x-3 top-1/2 z-10 flex -translate-y-1/2 justify-between sm:inset-x-6"
        >
          <Button
            variant="secondary"
            size="icon"
            class="pointer-events-auto size-12 rounded-full bg-background/85 shadow-lg backdrop-blur sm:size-14"
            :disabled="imgIdx <= 0"
            aria-label="이전 사진"
            @click.stop="previous(false)"
          >
            <ChevronLeftIcon class="size-7" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            class="pointer-events-auto size-12 rounded-full bg-background/85 shadow-lg backdrop-blur sm:size-14"
            :disabled="imgIdx >= view.images.length - 1"
            aria-label="다음 사진"
            @click.stop="next(false)"
          >
            <ChevronRightIcon class="size-7" />
          </Button>
        </div>

        <div
          v-if="view.images.length > 1"
          class="absolute bottom-5 left-1/2 rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur"
        >
          {{ imgIdx + 1 }} / {{ view.images.length }}
        </div>
      </div>

      <aside class="border-l border-border/60 bg-background/96 p-5 sm:p-7">
        <div class="sticky top-20 space-y-7">
          <div>
            <p
              v-if="config.useCategory && view.post.category.name"
              class="mb-2 text-xs font-semibold text-primary"
            >
              {{ recoverChars(view.post.category.name) }}
            </p>
            <h1 class="text-2xl font-semibold leading-tight tracking-[-0.035em]">
              {{ recoverChars(view.post.title) }}
            </h1>
            <p class="mt-3 text-xs text-muted-foreground">
              {{ dateFull(view.post.submitted) }} · 조회 {{ num(view.post.hit) }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <Avatar class="size-11 border border-border/70">
              <AvatarImage
                :src="view.post.writer.profile"
                :alt="recoverChars(view.post.writer.name)"
              />
              <AvatarFallback>{{ recoverChars(view.post.writer.name).charAt(0) }}</AvatarFallback>
            </Avatar>
            <div class="min-w-0">
              <NuxtLink
                :to="`/user/${view.post.writer.uid}`"
                class="font-semibold hover:text-primary"
                >{{ recoverChars(view.post.writer.name) }}</NuxtLink
              >
              <p class="mt-1 truncate text-xs text-muted-foreground">
                {{ recoverChars(view.post.writer.signature) }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              variant="outline"
              class="gap-2"
              :disabled="!isLoggedIn"
              @click="likePost(!view.post.liked)"
            >
              <HeartIcon
                class="size-4"
                :class="view.post.liked ? 'fill-current text-primary' : ''"
              />
              {{ num(view.post.like) }}
            </Button>
            <Button variant="outline" class="gap-2" :disabled="!currentImage" @click="openOriginal">
              <Maximize2Icon class="size-4" /> 원본 보기
            </Button>
          </div>

          <div
            v-if="currentImage?.exif.make"
            class="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border/60 py-5 font-mono text-xs text-muted-foreground"
          >
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
            <Badge v-for="tag in view.tags" :key="tag.uid" variant="secondary"
              >#{{ recoverChars(tag.name) }}</Badge
            >
          </div>

          <div class="flex flex-wrap justify-between gap-2 border-t border-border/60 pt-5">
            <Button variant="ghost" as-child
              ><NuxtLink :to="`/board/${config.id}/page/1`">목록</NuxtLink></Button
            >
            <div class="flex gap-2">
              <Button v-if="isWriter || isAdmin" variant="outline" as-child
                ><NuxtLink :to="`/board/${config.id}/${view.post.uid}/edit`"
                  >수정</NuxtLink
                ></Button
              >
              <Button v-if="isLoggedIn" as-child
                ><NuxtLink :to="`/board/${config.id}/write`">사진 올리기</NuxtLink></Button
              >
            </div>
          </div>
        </div>
      </aside>
    </section>

    <AdvanceGalleryComments />

    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="viewerOpen"
          ref="viewerDialog"
          class="fixed inset-0 z-[100] flex bg-black/96 text-white"
          role="dialog"
          aria-modal="true"
          aria-labelledby="original-viewer-title"
          tabindex="-1"
          @click.self="closeViewer"
        >
          <div
            class="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-linear-to-b from-black/75 to-transparent p-3 sm:p-5"
          >
            <div class="min-w-0">
              <p id="original-viewer-title" class="truncate text-sm font-medium">
                {{ recoverChars(view.post.title) }}
              </p>
              <p class="mt-1 text-xs text-white/60">
                {{ imgIdx + 1 }} / {{ Math.max(1, view.images.length) }}
              </p>
            </div>
            <div class="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                class="gap-2 bg-white/12 text-white hover:bg-white/20"
                @click="toggleFit"
                ><ScanIcon class="size-4" />{{ fitToScreen ? "1:1" : "화면 맞춤" }}</Button
              >
              <Button
                ref="closeButton"
                variant="secondary"
                size="icon"
                class="bg-white/12 text-white hover:bg-white/20"
                aria-label="전체 화면 닫기"
                @click="closeViewer"
                ><XIcon class="size-5"
              /></Button>
            </div>
          </div>

          <div
            ref="viewerViewport"
            class="h-full w-full overflow-auto p-4 pt-20"
            @click.self="closeViewer"
            @touchstart.passive="onTouchStart"
            @touchend.passive="onTouchEnd"
          >
            <div
              v-if="originalLoading"
              class="flex min-h-full flex-col items-center justify-center gap-3 text-sm text-white/70"
            >
              <LoaderCircleIcon class="size-7 animate-spin" />원본 이미지를 불러오는 중입니다
            </div>
            <div
              v-else-if="originalError"
              class="mx-auto mt-[35vh] max-w-sm -translate-y-1/2 rounded-xl border border-white/15 bg-white/10 p-5 text-center text-sm"
            >
              <p>{{ originalError }}</p>
              <Button variant="secondary" class="mt-4" @click="loadOriginal">다시 시도</Button>
            </div>
            <div
              v-else-if="originalUrl"
              class="grid min-h-full min-w-full place-items-center"
              :class="fitToScreen ? 'h-full w-full' : 'h-max w-max'"
            >
              <img
                :src="originalUrl"
                :alt="currentAlt"
                draggable="false"
                class="select-none"
                :class="
                  fitToScreen
                    ? 'max-h-full max-w-full cursor-zoom-in object-contain [touch-action:pinch-zoom]'
                    : 'max-h-[none] max-w-[none] cursor-grab [touch-action:pan-x_pan-y_pinch-zoom] active:cursor-grabbing'
                "
                @error="handleOriginalImageError"
                @load="handleOriginalImageLoad"
                @click.stop="toggleFit"
                @pointerdown="startPan"
                @pointermove="movePan"
                @pointerup="endPan"
                @pointercancel="endPan"
              />
            </div>
          </div>

          <Button
            v-if="view.images.length > 1"
            variant="secondary"
            size="icon"
            class="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/12 text-white hover:bg-white/20 sm:left-6"
            :disabled="imgIdx <= 0"
            aria-label="이전 원본 사진"
            @click="previous(true)"
            ><ChevronLeftIcon class="size-6"
          /></Button>
          <Button
            v-if="view.images.length > 1"
            variant="secondary"
            size="icon"
            class="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/12 text-white hover:bg-white/20 sm:right-6"
            :disabled="imgIdx >= view.images.length - 1"
            aria-label="다음 원본 사진"
            @click="next(true)"
            ><ChevronRightIcon class="size-6"
          /></Button>
          <p class="sr-only" aria-live="polite">{{ viewerStatus }}</p>
        </div>
      </Teleport>
    </ClientOnly>
  </article>
</template>

<script setup lang="ts">
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  LoaderCircleIcon,
  Maximize2Icon,
  ScanIcon,
  XIcon,
} from "lucide-vue-next"
import { useNuboViewContext } from "~/providers/contexts/view"
import AdvanceGalleryComments from "./components/AdvanceGalleryComments.vue"

const { config, imgIdx, isAdmin, isLoggedIn, isWriter, likePost, originalImageUrl, view } =
  useNuboViewContext()
const { sanitize } = useSanitize()
const viewerOpen = ref(false)
const fitToScreen = ref(true)
const originalLoading = ref(false)
const originalUrl = ref("")
const originalError = ref("")
let requestSequence = 0
const previewButton = ref<HTMLElement | null>(null)
const viewerDialog = ref<HTMLElement | null>(null)
const viewerViewport = ref<HTMLElement | null>(null)
const closeButton = ref<{ $el: HTMLElement } | null>(null)
let returnFocus: HTMLElement | null = null
let previousBodyOverflow = ""
let touchStart: { x: number; y: number } | null = null
let ignoreNextImageClick = false
let panStart: { x: number; y: number; left: number; top: number; pointerId: number } | null = null

const currentImage = computed(() => view.value.images[imgIdx.value])
const previewSource = computed(() =>
  currentImage.value
    ? getPreviewImage(currentImage.value.thumbnail.large)
    : getPreviewImage(view.value.post.cover),
)
const currentAlt = computed(
  () => `${recoverChars(view.value.post.title)} 이미지 ${imgIdx.value + 1}`,
)
const viewerStatus = computed(() =>
  originalLoading.value
    ? "원본 이미지를 불러오는 중입니다"
    : originalError.value ||
      (originalUrl.value ? `${imgIdx.value + 1}번째 원본 이미지를 표시했습니다` : ""),
)

const loadOriginal = async () => {
  const fileUid = currentImage.value?.file.uid
  const sequence = ++requestSequence
  originalLoading.value = false
  originalError.value = ""
  originalUrl.value = ""
  if (!fileUid) {
    originalError.value = "이 사진의 원본 파일을 찾을 수 없습니다."
    return
  }
  originalLoading.value = true
  try {
    const url = await originalImageUrl(fileUid)
    if (sequence === requestSequence) originalUrl.value = url
  } catch (error) {
    if (sequence === requestSequence)
      originalError.value =
        error instanceof Error ? error.message : "원본 이미지를 불러오지 못했습니다."
  } finally {
    if (sequence === requestSequence) originalLoading.value = false
  }
}

const openOriginal = async () => {
  if (!previewSource.value) return
  returnFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : previewButton.value
  viewerOpen.value = true
  fitToScreen.value = true
  await nextTick()
  closeButton.value?.$el.focus()
  await loadOriginal()
}
const closeViewer = () => {
  viewerOpen.value = false
  requestSequence++
  originalLoading.value = false
  originalError.value = ""
  originalUrl.value = ""
  panStart = null
  nextTick(() => returnFocus?.focus())
}
const previous = async (reload: boolean) => {
  if (imgIdx.value > 0) {
    imgIdx.value--
    if (reload) await loadOriginal()
  }
}
const next = async (reload: boolean) => {
  if (imgIdx.value < view.value.images.length - 1) {
    imgIdx.value++
    if (reload) await loadOriginal()
  }
}
const centerOriginal = () => {
  const viewport = viewerViewport.value
  if (!viewport) return
  viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2)
  viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2)
}
const toggleFit = async () => {
  if (ignoreNextImageClick) {
    ignoreNextImageClick = false
    return
  }
  fitToScreen.value = !fitToScreen.value
  await nextTick()
  if (fitToScreen.value) viewerViewport.value?.scrollTo({ left: 0, top: 0 })
  else centerOriginal()
}
const handleOriginalImageLoad = async () => {
  if (fitToScreen.value) return
  await nextTick()
  centerOriginal()
}
const startPan = (event: PointerEvent) => {
  const viewport = viewerViewport.value
  if (fitToScreen.value || event.pointerType !== "mouse" || event.button !== 0 || !viewport)
    return
  panStart = {
    x: event.clientX,
    y: event.clientY,
    left: viewport.scrollLeft,
    top: viewport.scrollTop,
    pointerId: event.pointerId,
  }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  event.preventDefault()
}
const movePan = (event: PointerEvent) => {
  const viewport = viewerViewport.value
  if (!panStart || panStart.pointerId !== event.pointerId || !viewport) return
  const dx = event.clientX - panStart.x
  const dy = event.clientY - panStart.y
  if (Math.abs(dx) + Math.abs(dy) > 4) ignoreNextImageClick = true
  viewport.scrollLeft = panStart.left - dx
  viewport.scrollTop = panStart.top - dy
}
const endPan = (event: PointerEvent) => {
  if (!panStart || panStart.pointerId !== event.pointerId) return
  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
  panStart = null
}
const handleOriginalImageError = () => {
  originalUrl.value = ""
  originalError.value = "원본 이미지 데이터를 표시하지 못했습니다. 다시 시도해주세요."
}
const onTouchStart = (event: TouchEvent) => {
  if (!fitToScreen.value || event.touches.length !== 1) return
  const touch = event.touches[0]
  if (touch) touchStart = { x: touch.clientX, y: touch.clientY }
}
const onTouchEnd = (event: TouchEvent) => {
  if (!touchStart || !fitToScreen.value || event.changedTouches.length !== 1) {
    touchStart = null
    return
  }
  const touch = event.changedTouches[0]
  if (!touch) return
  const dx = touch.clientX - touchStart.x
  const dy = touch.clientY - touchStart.y
  touchStart = null
  if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return
  ignoreNextImageClick = true
  if (dx > 0) void previous(true)
  else void next(true)
}
const onKeydown = (event: KeyboardEvent) => {
  if (!viewerOpen.value) return
  if (event.key === "Escape") {
    event.preventDefault()
    closeViewer()
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault()
    void previous(true)
  }
  if (event.key === "ArrowRight") {
    event.preventDefault()
    void next(true)
  }
  if (event.key === "Tab" && viewerDialog.value) {
    const focusable = [
      ...viewerDialog.value.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ]
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

watch(viewerOpen, (open) => {
  if (open) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
  } else document.body.style.overflow = previousBodyOverflow
})
onMounted(() => window.addEventListener("keydown", onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown)
  document.body.style.overflow = previousBodyOverflow
})
</script>
