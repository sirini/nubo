<template>
  <div class="flex items-center gap-6">
    <div v-if="auth.isAdmin" class="flex items-center space-x-2">
      <Checkbox id="notice" v-model:checked="edit.isNotice" />
      <Label for="notice" class="cursor-pointer font-normal text-muted-foreground"
        >공지글로 설정</Label
      >
    </div>

    <div class="flex items-center space-x-2">
      <Checkbox id="secret" v-model:checked="edit.isSecret" />
      <Label for="secret" class="cursor-pointer font-normal text-muted-foreground"
        >비밀글로 설정</Label
      >
    </div>
  </div>

  <div v-if="edit.categories.length > 0">
    <CommonVSelect v-model="edit.categoryUid" placeholder="게시글 분류 선택" :options="sc" />
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const edit = useEditorStore()
const sc = ref<{ label: string; value: number }[]>([]) // select category
</script>
