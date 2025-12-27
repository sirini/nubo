<template>
  <component :is="selectedSkin">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner"
import { SEARCH, type Search } from "~/types/board"
import { nuboLayoutKey } from "~/types/nubo-skin-keys"

const config = useRuntimeConfig()
const router = useRouter()
const { addVisitHistory } = useHome()
const auth = useAuthStore()
const home = useHomeStore()
const selectedSkin = computed(() => {
  const skinName = config.public.defaultSkins.layout
  return defineAsyncComponent(() => import(`../skins/layout/${skinName}/Layout.vue`))
})

await home.getInitMenus()

// 로그인 여부 확인해서 업뎃해놓기
await useAsyncData(
  "init-auth",
  async () => {
    if (!auth.isLoggedIn) {
      await auth.getInitUserInfo()
    }
    return auth.isLoggedIn
  },
  {
    watch: [],
  },
)

onNuxtReady(() => {
  addVisitHistory()
})

provide(nuboLayoutKey, {
  isLoggedIn: computed(() => auth.isLoggedIn),
  user: computed(() => auth.user),
  menus: computed(() => home.menus),
  searchOptions: computed(() => [
    { label: "제목", value: SEARCH.TITLE },
    { label: "내용", value: SEARCH.CONTENT },
    { label: "작성자", value: SEARCH.WRITER },
    { label: "태그", value: SEARCH.TAG },
    { label: "이미지", value: SEARCH.IMAGEDESC },
  ]),
  searchOption: computed({ get: () => home.option, set: (val: Search) => (home.option = val) }),
  searchKeyword: computed({ get: () => home.keyword, set: (val: string) => (home.keyword = val) }),
  search: (event: Event) => {
    event.preventDefault()
    if (home.keyword.length < 2) {
      toast("검색어는 2글자 이상 입력해주세요!")
      return
    }
    router.push(`/search/${encodeURIComponent(home.keyword)}?option=${home.option}`)
  },
  moveTop: () => {
    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  },
})
</script>
