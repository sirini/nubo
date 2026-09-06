<template>
  <section class="container mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-10">
    <AdvanceProfileHeader />

    <UserAchievementShelf :badges="profileUser.badges ?? []" />

    <Tabs v-model="selectedTab" class="space-y-5">
      <TabsList class="grid w-full max-w-md" :class="isMe ? 'grid-cols-2' : 'grid-cols-2'">
        <TabsTrigger v-if="isMe" value="studio">내 작품 스튜디오</TabsTrigger>
        <TabsTrigger value="activity">최근 활동</TabsTrigger>
        <TabsTrigger v-if="!isMe" value="conversation">대화</TabsTrigger>
      </TabsList>

      <TabsContent v-if="isMe" value="studio">
        <AdvanceProfileStudio />
      </TabsContent>
      <TabsContent value="activity">
        <AdvanceProfileActivity />
      </TabsContent>
      <TabsContent v-if="!isMe" value="conversation">
        <AdvanceProfileConversation />
      </TabsContent>
    </Tabs>
  </section>

  <AdvanceProfileReportDialog v-if="isOpenReportForm" />
</template>

<script setup lang="ts">
import { useNuboProfileContext } from "~/providers/contexts/profile"
import AdvanceProfileActivity from "./components/AdvanceProfileActivity.vue"
import AdvanceProfileConversation from "./components/AdvanceProfileConversation.vue"
import AdvanceProfileHeader from "./components/AdvanceProfileHeader.vue"
import AdvanceProfileReportDialog from "./components/AdvanceProfileReportDialog.vue"
import AdvanceProfileStudio from "./components/AdvanceProfileStudio.vue"

defineOptions({ name: "NuboAdvanceProfilePage" })

const { isMe, isOpenReportForm, profileUser } = useNuboProfileContext()
const route = useRoute()
const selectedTab = ref("activity")

watch(
  [isMe, () => route.query.tab],
  ([viewingSelf, requestedTab]) => {
    selectedTab.value = viewingSelf
      ? "studio"
      : requestedTab === "conversation"
        ? "conversation"
        : "activity"
  },
  { immediate: true },
)
</script>
