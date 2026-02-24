<template>
  <component :is="selectedSkin" />
</template>

<script setup lang="ts">
import { useProfileProvider } from "~/providers/profile"
import { nuboProfileKey } from "~/providers/contexts/profile"

const config = useRuntimeConfig()
const route = useRoute()
const auth = useAuthStore()
const chat = useChatStore()
const report = useReportStore()
const targetUserUid = computed(() => parseInt(route.params.userUid as string))
const limit = 5
const modules = import.meta.glob("~/skins/profile/*/Profile.vue")
const selectedSkin = getSkin(modules, config.public.skins.profile, "nubo-basic-profile")

await Promise.all([
  auth.getInitOtherUserInfo(targetUserUid.value),
  auth.getInitUserLatestContent(targetUserUid.value, limit),
  chat.getChatHistory(targetUserUid.value),
  report.loadReportStatus(),
])

provide(nuboProfileKey, useProfileProvider())
</script>
