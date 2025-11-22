<template>
  <Select v-model="model">
    <SelectTrigger>
      <SelectValue :placeholder="placeholder || '선택하세요'" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel v-if="label">{{ label }}</SelectLabel>

        <SelectItem v-for="(opt, idx) in options" :key="idx" :value="opt.value">{{
          opt.label
        }}</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
const model = defineModel<any>()

interface Option {
  label: string
  value: any
}

defineProps<{
  placeholder?: string
  options: Option[]
  label?: string
}>()
</script>
