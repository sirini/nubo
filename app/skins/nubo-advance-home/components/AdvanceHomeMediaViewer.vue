<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="open && currentPost"
        ref="viewerDialog"
        class="fixed inset-0 z-[100] flex bg-black/96 text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="advance-home-viewer-title"
        tabindex="-1"
        @click.self="close"
      >
        <header
          class="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-linear-to-b from-black/80 to-transparent p-3 sm:p-5"
        >
          <div class="min-w-0">
            <p id="advance-home-viewer-title" class="truncate text-sm font-medium sm:text-base">
              {{ recoverChars(currentPost.title) }}
            </p>
            <p class="mt-1 text-xs text-white/60">
              n/{{ currentPost.id }} · {{ index + 1 }} / {{ posts.length }}
            </p>
          </div>

          <div class="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              size="sm"
              class="hidden gap-2 bg-white/12 text-white hover:bg-white/20 sm:inline-flex"
              @click="toggleFit"
            >
              <ScanIcon class="size-4" /> {{ fitToScreen ? "1:1" : "화면 맞춤" }}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              class="hidden gap-2 bg-white/12 text-white hover:bg-white/20 md:inline-flex"
              as-child
            >
              <NuxtLink :to="postPath" @click="close">
                <ExternalLinkIcon class="size-4" /> 게시글 보기
              </NuxtLink>
            </Button>
            <Button
              ref="closeButton"
              variant="secondary"
              size="icon"
              class="bg-white/12 text-white hover:bg-white/20"
              aria-label="전체 화면 닫기"
              @click="close"
            >
              <XIcon class="size-5" />
            </Button>
          </div>
        </header>

        <div
          ref="viewerViewport"
          class="h-full w-full overflow-auto p-4 pb-20 pt-20"
          @click.self="close"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <div
            class="grid min-h-full min-w-full place-items-center"
            :class="fitToScreen ? 'h-full w-full' : 'h-max w-max'"
            @click.self="close"
          >
            <img
              :src="imageSource"
              :alt="recoverChars(currentPost.title)"
              draggable="false"
              class="select-none"
              :class="
                fitToScreen
                  ? 'max-h-full max-w-full cursor-zoom-in object-contain [touch-action:pinch-zoom]'
                  : 'max-h-[none] max-w-[none] cursor-grab [touch-action:pan-x_pan-y_pinch-zoom] active:cursor-grabbing'
              "
              @click.stop="toggleFit"
              @load="centerImage"
              @pointerdown="startPan"
              @pointermove="movePan"
              @pointerup="endPan"
              @pointercancel="endPan"
            />
          </div>
        </div>

        <Button
          v-if="posts.length > 1"
          variant="secondary"
          size="icon"
          class="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/12 text-white hover:bg-white/20 sm:left-6"
          :disabled="index <= 0"
          aria-label="이전 미디어"
          @click="previous"
        >
          <ChevronLeftIcon class="size-6" />
        </Button>
        <Button
          v-if="posts.length > 1"
          variant="secondary"
          size="icon"
          class="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/12 text-white hover:bg-white/20 sm:right-6"
          :disabled="index >= posts.length - 1"
          aria-label="다음 미디어"
          @click="next"
        >
          <ChevronRightIcon class="size-6" />
        </Button>

        <footer
          class="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 bg-linear-to-t from-black/80 to-transparent p-4 pt-10 sm:p-6 sm:pt-12"
        >
          <p class="min-w-0 truncate text-xs text-white/65">
            {{ recoverChars(currentPost.writer.name) }} · {{ dateFull(currentPost.submitted) }}
          </p>
          <span class="shrink-0 rounded-full bg-white/12 px-3 py-1 text-xs text-white/75">
            {{ index + 1 }} / {{ posts.length }}
          </span>
        </footer>

        <p class="sr-only" aria-live="polite">
          {{ index + 1 }}번째 미디어를 전체 화면으로 표시했습니다.
        </p>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  ScanIcon,
  XIcon,
} from "lucide-vue-next"
import type { HomePostItem } from "~/types/home"

const props = defineProps<{
  open: boolean
  posts: HomePostItem[]
  index: number
}>()
const emit = defineEmits<{
  close: []
  "update:index": [index: number]
}>()

const fitToScreen = ref(true)
const viewerDialog = ref<HTMLElement | null>(null)
const viewerViewport = ref<HTMLElement | null>(null)
const closeButton = ref<{ $el: HTMLElement } | null>(null)
let returnFocus: HTMLElement | null = null
let previousBodyOverflow = ""
let bodyLocked = false
let touchStart: { x: number; y: number } | null = null
let ignoreNextImageClick = false
let panStart: { x: number; y: number; left: number; top: number; pointerId: number } | null = null

const currentPost = computed(() => props.posts[props.index])
const imageSource = computed(() => getPreviewImage(currentPost.value?.cover || ""))
const postPath = computed(() =>
  currentPost.value ? `/board/${currentPost.value.id}/${currentPost.value.uid}` : "/",
)

const close = () => emit("close")
const setIndex = async (index: number) => {
  fitToScreen.value = true
  emit("update:index", index)
  await nextTick()
  viewerViewport.value?.scrollTo({ left: 0, top: 0 })
}
const previous = () => {
  if (props.index > 0) void setIndex(props.index - 1)
}
const next = () => {
  if (props.index < props.posts.length - 1) void setIndex(props.index + 1)
}
const centerImage = async () => {
  if (fitToScreen.value) return
  await nextTick()
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
  else await centerImage()
}
const startPan = (event: PointerEvent) => {
  const viewport = viewerViewport.value
  if (fitToScreen.value || event.pointerType !== "mouse" || event.button !== 0 || !viewport) return
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
  if (dx > 0) previous()
  else next()
}
const onKeydown = (event: KeyboardEvent) => {
  if (!props.open) return
  if (event.key === "Escape") {
    event.preventDefault()
    close()
  } else if (event.key === "ArrowLeft") {
    event.preventDefault()
    previous()
  } else if (event.key === "ArrowRight") {
    event.preventDefault()
    next()
  } else if (event.key === "Tab" && viewerDialog.value) {
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

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      bodyLocked = true
      fitToScreen.value = true
      await nextTick()
      closeButton.value?.$el.focus()
    } else {
      document.body.style.overflow = previousBodyOverflow
      bodyLocked = false
      panStart = null
      await nextTick()
      returnFocus?.focus()
    }
  },
)
onMounted(() => window.addEventListener("keydown", onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown)
  if (bodyLocked) document.body.style.overflow = previousBodyOverflow
})
</script>
