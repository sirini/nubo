<template>
  <Dialog>
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>

    <DialogContent class="sm:max-w-200">
      <DialogHeader>
        <DialogTitle>스킨 선택</DialogTitle>
        <DialogDescription>원하시는 스타일의 스킨을 선택해 주세요</DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-2 gap-4 py-4">
        <template v-for="(skin, index) in skins" :key="index">
          <div
            v-if="skin.type === type"
            class="border-2 rounded-xl p-3 cursor-pointer transition-all hover:border-primary group/item"
          >
            <div
              class="aspect-video bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden"
            >
              <span
                class="text-xs text-muted-foreground group-hover/item:scale-110 transition-transform"
                >No preview image</span
              >
            </div>
            <div class="flex items-center justify-between px-1">
              <span class="text-sm font-medium">{{ skin.name }}</span>
              <Badge variant="outline">
                <CommonVTooltip content="스킨 개발자의 사이트를 열어봅니다">
                  <a :href="skin.website" class="flex items-center gap-2" target="_blank">
                    <span class="text-sm font-medium">{{ skin.author }}</span>
                    <ExternalLinkIcon class="w-4 h-4" />
                  </a>
                </CommonVTooltip>
              </Badge>
            </div>
            <div class="px-1 py-2 text-sm text-muted-foreground">
              {{ skin.description }}

              <div class="pt-3">
                <Badge variant="secondary" v-for="feature in skin.features" class="mr-2">{{
                  feature
                }}</Badge>
              </div>
            </div>
          </div>
        </template>
      </div>

      <DialogFooter>
        <Button class="text-foreground cursor-pointer" @click="changeSkinNoti">적용하기</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ExternalLinkIcon } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { AdminSkinInfo, AdminSkinType } from "~/types/admin"

defineProps<{
  type: AdminSkinType
}>()

// 스킨들 목록
const skins = ref<AdminSkinInfo[]>([
  {
    type: "layout",
    key: "nubo-basic-layout",
    name: "기본 레이아웃 스킨",
    version: "0.1.0",
    author: "sirini",
    website: "https://nubohub.org",
    description: "상단 좌측 메뉴, 우측 전체 검색을 제공하는 기본적인 레이아웃입니다",
    preview: "preview.png",
    features: ["다크모드", "반응형 그리드"],
    min_nubo_version: "1.2.0",
  },
  {
    type: "home",
    key: "nubo-basic-home",
    name: "기본 메인 페이지 스킨",
    version: "0.1.0",
    author: "sirini",
    website: "https://nubohub.org",
    description:
      "상단에 히어로 섹션, 하단에는 최신글들이 그리드 형식으로 출력되는 기본적인 메인 페이지입니다",
    preview: "preview.png",
    features: ["다크모드", "반응형 그리드"],
    min_nubo_version: "1.2.0",
  },
  {
    type: "admin",
    key: "nubo-basic-admin",
    name: "기본 관리화면 스킨",
    version: "0.1.0",
    author: "sirini",
    website: "https://nubohub.org",
    description: "기본적인 게시판/회원 관리 기능을 포함하는 태블릿/PC 화면 전용 관리 화면입니다",
    preview: "preview.png",
    features: ["다크모드"],
    min_nubo_version: "1.2.0",
  },
  {
    type: "login",
    key: "nubo-basic-login",
    name: "기본 로그인 및 회원가입 스킨",
    version: "0.1.0",
    author: "sirini",
    website: "https://nubohub.org",
    description: "소셜 로그인 버튼들을 포함한 기본적인 로그인 및 회원가입 스킨입니다",
    preview: "preview.png",
    features: ["다크모드", "반응형 그리드"],
    min_nubo_version: "1.2.0",
  },
  {
    type: "profile",
    key: "nubo-basic-profile",
    name: "기본 프로필 스킨",
    version: "0.1.0",
    author: "sirini",
    website: "https://nubohub.org",
    description: "기본적인 프로필 보기 및 1:1 대화 기능을 내장한 스킨입니다",
    preview: "preview.png",
    features: ["다크모드", "반응형 그리드"],
    min_nubo_version: "1.2.0",
  },
  {
    type: "privacy",
    key: "nubo-basic-privacy",
    name: "기본 개인정보 스킨",
    version: "0.1.0",
    author: "sirini",
    website: "https://nubohub.org",
    description: "기본적인 개인정보 처리방침을 표시한 스킨입니다",
    preview: "preview.png",
    features: ["다크모드", "반응형 그리드"],
    min_nubo_version: "1.1.0",
  },
  {
    type: "error",
    key: "nubo-basic-error",
    name: "기본 홈 레이아웃",
    version: "0.1.0",
    author: "sirini",
    website: "https://nubohub.org",
    description: "잘못된 페이지 접근 및 에러 페이지 표시에 사용하는 기본적인 스킨입니다",
    preview: "preview.png",
    features: ["다크모드", "반응형 그리드"],
    min_nubo_version: "1.1.0",
  },
  {
    type: "board",
    key: "nubo-basic-board",
    name: "기본 게시판 및 갤러리 스킨",
    version: "0.1.0",
    author: "sirini",
    website: "https://nubohub.org",
    description: "기본적인 게시판 및 갤러리에서 사용 가능한 스킨입니다",
    preview: "preview.png",
    features: ["다크모드", "반응형 그리드"],
    min_nubo_version: "1.2.0",
  },
])

const changeSkinNoti = () => {
  toast(`📢 스킨 변경은 NUBO v1.2.0 이후 버전에서 제공됩니다`)
}
</script>
