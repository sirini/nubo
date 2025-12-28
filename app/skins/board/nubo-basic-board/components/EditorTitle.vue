<template>
  <div class="relative">
    <Input
      v-model="title"
      placeholder="제목을 입력하세요"
      class="text-lg font-medium"
      autocomplete="off"
    />

    <div
      v-if="titleSuggestions.length > 0 || isSearchingTitles"
      class="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden"
    >
      <div v-if="isSearchingTitles" class="p-2 text-sm text-muted-foreground flex items-center">
        <Loader2Icon class="w-4 h-4 animate-spin mr-2" /> 검색 중...
      </div>
      <ul v-else-if="titleSuggestions.length > 0" class="py-1">
        <li
          v-for="(item, index) in titleSuggestions"
          :key="index"
          class="px-3 py-2 text-sm text-blue-300 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
          @click="selectSuggestedTitle(item)"
        >
          {{ item }}
        </li>
        <li
          class="border-t px-3 py-2 text-sm flex items-center justify-between cursor-pointer"
          @click="titleSuggestions = []"
        >
          <span>유사한 제목들 목록 닫기</span>
          <XIcon class="w-4 h-4" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2Icon, XIcon } from "lucide-vue-next"
import { useNuboWriteContext } from "~/types/nubo-skin-keys"

const { title, titleSuggestions, isSearchingTitles, selectSuggestedTitle } = useNuboWriteContext()
</script>
