import type { MaybeRefOrGetter, Ref } from "vue"

export const scrollChatViewportToBottom = (
  root: HTMLElement | null,
  behavior: ScrollBehavior = "smooth",
) => {
  const viewport = root?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
  if (!viewport) return

  viewport.scrollTo({ top: viewport.scrollHeight, behavior })
}

export const useChatAutoScroll = (
  root: Ref<HTMLElement | null>,
  latestMessageUid: MaybeRefOrGetter<number | undefined>,
) => {
  const scrollToBottom = async (behavior: ScrollBehavior = "smooth") => {
    await nextTick()
    const scroll = () => scrollChatViewportToBottom(root.value, behavior)
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(scroll)
    else scroll()
  }

  onMounted(() => void scrollToBottom("auto"))
  watch(
    () => toValue(latestMessageUid),
    (uid, previousUid) => {
      if (uid === undefined || uid === previousUid) return
      void scrollToBottom()
    },
    { flush: "post" },
  )

  return { scrollToBottom }
}
