<template>
  <div
    class="flex flex-wrap gap-2 p-3 border rounded-md bg-background min-h-12 items-center focus-within:ring-1 focus-within:ring-ring"
  >
    <Badge
      v-for="(tag, index) in edit.tags"
      :key="index"
      variant="secondary"
      class="pl-2 pr-2 py-1 text-sm flex items-center gap-1 cursor-pointer"
      @click="edit.removeTag(index)"
    >
      {{ tag }}
    </Badge>

    <div class="relative flex-1 min-w-30">
      <CommonVTooltip content="해시태그는 특수기호 및 공백을 허용하지 않습니다">
        <Input
          v-model="edit.tag"
          class="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          placeholder="태그입력 (엔터)"
          @keydown.enter.prevent="edit.addTag"
          @keydown.tab.prevent="edit.addTag"
          @keydown.comma.prevent="edit.addTag"
          @keydown.space.prevent="edit.addTag"
        />
      </CommonVTooltip>

      <div
        v-if="edit.tagSuggestions.length > 0"
        class="absolute bottom-full mb-1 left-0 w-48 bg-popover border rounded-md shadow-md z-10"
      >
        <div
          v-for="(item, idx) in edit.tagSuggestions"
          :key="idx"
          class="px-4 py-3 text-sm hover:bg-accent cursor-pointer flex items-center justify-between"
          @click="selectSuggestedTag(item.name)"
        >
          <span class="text-blue-300">{{ item.name }}</span>
          <span class="text-muted-foreground">{{ item.count }}회</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const edit = useEditorStore()

// 추천된 태그를 입력하기
const selectSuggestedTag = (tag: string) => {
  edit.tag = tag
  edit.addTag()
}

// 해시태그 자동완성
watch(() => edit.tag, edit.searchTags)
</script>
