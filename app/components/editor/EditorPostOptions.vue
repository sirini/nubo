<template>
  <div class="flex items-center gap-6">
    <div v-if="auth.isAdmin" class="flex items-center space-x-2">
      <Checkbox id="notice" v-model="edit.isNotice" />
      <Label for="notice" class="cursor-pointer font-normal text-muted-foreground"
        >공지글로 설정</Label
      >
    </div>

    <div class="flex items-center space-x-2">
      <Checkbox id="secret" v-model="edit.isSecret" />
      <Label for="secret" class="cursor-pointer font-normal text-muted-foreground"
        >비밀글로 설정</Label
      >
    </div>
  </div>

  <div v-if="edit.categories.length > 0">
    <Select v-model="edit.categoryUid">
      <SelectTrigger>
        <SelectValue :placeholder="edit.categories[edit.categoryUid]?.name" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem v-for="(cat, idx) in edit.categories" :key="idx" :value="cat.uid">{{
            cat.name
          }}</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const edit = useEditorStore()
</script>
