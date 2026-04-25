<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { nuboProfileKey } from "~/providers/contexts/profile"
import { useProfileProvider } from "~/providers/profile"

const config = useRuntimeConfig()
const route = useRoute()
const auth = useAuthStore()
const chat = useChatStore()
const report = useReportStore()

const targetUserUid = computed(() => parseInt(route.params.userUid as string))

const limit = 5
const modules = import.meta.glob("~/skins/*/Profile.vue")
const selectedSkin = getSkin(modules, config.public.skins.profile, "nubo-basic-profile")

// 하이드레이션 미스매치 방지 및 캐싱
const { data: initData } = await useAsyncData(
  `profile-${targetUserUid.value}`,
  async () => {
    await Promise.all([
      auth.getInitOtherUserInfo(targetUserUid.value),
      auth.getInitUserLatestContent(targetUserUid.value, limit),
      chat.getChatHistory(targetUserUid.value),
      report.loadReportStatus(targetUserUid.value),
    ])
    return { success: true, timestamp: Date.now() }
  },
  {
    watch: [() => route.params.userUid],
  },
)

provide(nuboProfileKey, useProfileProvider())
</script>
