<template>
  <section class="max-w-6xl mx-auto">
    <div
      class="grid grid-cols-1 md:grid-cols-4 grid-rows-none md:grid-rows-2 gap-4 h-auto md:h-200"
    >
      <ProfileMain :target-user-uid="targetUserUid" />
      <Card class="md:col-span-2 md:row-span-2 overflow-hidden p-0">
        <div class="p-4 border-b bg-muted/30">
          <h3 class="font-semibold text-sm flex items-center gap-2">
            <span class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            대화 기록
          </h3>
        </div>
        <ProfileChatHistory />
      </Card>

      <ProfileLatestPosts :posts="auth.userLatestPosts" />
      <ProfileLatestComments :comments="auth.userLatestComments" />
    </div>
  </section>

  <LazyProfileUserReportDialog v-if="report.isOpenReportForm" />
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuthStore()
const chat = useChatStore()
const report = useReportStore()
const targetUserUid = computed(() => parseInt(route.params.userUid as string))
const limit = 5

await Promise.all([
  auth.getInitOtherUserInfo(targetUserUid.value),
  auth.getInitUserLatestContent(targetUserUid.value, limit),
])

onMounted(async () => {
  await chat.getChatHistory(targetUserUid.value)
})
</script>
