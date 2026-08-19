<template>
  <section class="container mx-auto py-6 max-w-5xl">
    <div class="grid grid-cols-1 md:grid-cols-4 grid-rows-none md:grid-rows-2 gap-4 h-auto">
      <ProfileMain />
      <Card class="md:col-span-2 md:row-span-2 overflow-hidden p-0">
        <div class="p-4 border-b bg-muted/30">
          <h3 class="font-semibold text-sm flex items-center gap-2">
            <span class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            대화 기록
          </h3>
        </div>
        <ProfileChatHistory />
      </Card>

      <ProfileLatestPosts />
      <ProfileLatestComments />

      <ProfileSimpleInfoBox title="레벨" :content="`Lv. ${profileUser.level}`">
        <GraduationCapIcon class="w-4 h-4" />
      </ProfileSimpleInfoBox>

      <ProfileSimpleInfoBox title="가입일" :content="date(profileUser.signup)">
        <UserRoundPlusIcon class="w-4 h-4" />
      </ProfileSimpleInfoBox>

      <ProfileSimpleInfoBox v-if="isMe" title="포인트" :content="num(myPoint)">
        <CoinsIcon class="w-4 h-4" />
      </ProfileSimpleInfoBox>
    </div>
  </section>

  <ProfileUserReportDialog v-if="isOpenReportForm" />
</template>

<script setup lang="ts">
import { CoinsIcon, GraduationCapIcon, UserRoundPlusIcon } from "lucide-vue-next"
import { useNuboProfileContext } from "~/providers/contexts/profile"
import ProfileChatHistory from "./components/ProfileChatHistory.vue"
import ProfileLatestComments from "./components/ProfileLatestComments.vue"
import ProfileLatestPosts from "./components/ProfileLatestPosts.vue"
import ProfileMain from "./components/ProfileMain.vue"
import ProfileSimpleInfoBox from "./components/ProfileSimpleInfoBox.vue"
import ProfileUserReportDialog from "./components/ProfileUserReportDialog.vue"

defineOptions({ name: "NuboProfilePage" })

const { profileUser, myPoint, isMe, isOpenReportForm } = useNuboProfileContext()
</script>
