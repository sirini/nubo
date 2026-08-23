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
      class="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl"
    >
      <div v-if="isSearchingTitles" class="flex items-center px-3 py-2.5 text-sm text-muted-foreground">
        <Loader2Icon class="w-4 h-4 animate-spin mr-2" /> 검색 중...
      </div>
      <ul v-else-if="titleSuggestions.length > 0" class="py-1.5">
        <li
          v-for="(item, index) in titleSuggestions"
          :key="index"
          class="cursor-pointer px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          @click="selectSuggestedTitle(item)"
        >
          {{ item }}
        </li>
        <li
          class="mt-1 flex cursor-pointer items-center justify-between border-t border-border/70 px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
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
import { useNuboWriteContext } from "~/providers/contexts/write"

const { title, titleSuggestions, isSearchingTitles, selectSuggestedTitle } = useNuboWriteContext()
</script>
