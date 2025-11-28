<template>
  <div class="relative">
    <Input
      v-model="edit.title"
      placeholder="제목을 입력하세요"
      class="text-lg font-medium"
      autocomplete="off"
    />

    <div
      v-if="edit.titleSuggestions.length > 0 || edit.isSearchingTitles"
      class="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden"
    >
      <div
        v-if="edit.isSearchingTitles"
        class="p-2 text-sm text-muted-foreground flex items-center"
      >
        <Loader2Icon class="w-4 h-4 animate-spin mr-2" /> 검색 중...
      </div>
      <ul v-else-if="edit.titleSuggestions.length > 0" class="py-1">
        <li
          v-for="(item, index) in edit.titleSuggestions"
          :key="index"
          class="px-3 py-2 text-sm text-blue-300 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
          @click="edit.selectTitle(item)"
        >
          {{ item }}
        </li>
        <li
          class="border-t px-3 py-2 text-sm flex items-center justify-between cursor-pointer"
          @click="edit.titleSuggestions = []"
        >
          <span>유사한 제목들 목록 닫기</span>
          <XIcon class="w-4 h-4" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const edit = useEditorStore()

// 유사한 글제목 검색
watch(() => edit.title, edit.searchTitles)
</script>
