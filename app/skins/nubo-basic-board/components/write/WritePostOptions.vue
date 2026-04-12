<template>
  <div class="flex items-center gap-6">
    <div v-if="categories.length > 0">
      <Select v-model="categoryUid">
        <SelectTrigger>
          <SelectValue :placeholder="categories[categoryUid]?.name" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="(cat, idx) in categories" :key="idx" :value="cat.uid">{{
              cat.name
            }}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <div v-if="isAdmin" class="flex items-center space-x-2">
      <Checkbox id="notice" v-model="isNotice" />
      <CommonVTooltip content="공지글은 관리자만 설정 가능합니다">
        <Label for="notice" class="cursor-pointer font-normal text-muted-foreground">공지</Label>
      </CommonVTooltip>
    </div>

    <div class="flex items-center space-x-2">
      <Checkbox id="secret" v-model="isSecret" />
      <Label for="secret" class="cursor-pointer font-normal text-muted-foreground">비밀글</Label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNuboWriteContext } from "~/providers/contexts/write"

const { isAdmin, isNotice, isSecret, categories, categoryUid } = useNuboWriteContext()
</script>
