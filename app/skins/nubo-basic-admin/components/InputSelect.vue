<template>
  <VeeField v-slot="{ field, errors }" :name="name">
    <div class="flex items-center justify-center gap-4">
      <FieldLabel :for="name" :class="[labelWidth, 'justify-end text-muted-foreground']">
        {{ label }}
      </FieldLabel>

      <div :class="inputClass">
        <slot :field="field" :errors="errors">
          <Select
            :model-value="field.value"
            @update:model-value="field.onChange"
            @blur="field.onBlur"
          >
            <SelectTrigger :id="name" :aria-invalid="!!errors.length">
              <SelectValue :placeholder="placeholder" />
            </SelectTrigger>
            <SelectContent position="item-aligned">
              <SelectItem v-for="(item, idx) in items" :key="idx" :value="item.value">{{
                item.name
              }}</SelectItem>
            </SelectContent>
          </Select>
        </slot>
      </div>

      <FieldDescription class="flex-1">
        <span v-if="!errors.length" class="text-muted">
          {{ description }}
        </span>
        <span v-else class="text-red-400 font-medium">{{ errors[0] }}</span>
      </FieldDescription>
    </div>
  </VeeField>
</template>

<script setup lang="ts">
import { Field as VeeField } from "vee-validate"

withDefaults(
  defineProps<{
    name: string
    label: string
    items: { name: string; value: number }[]
    description?: string
    placeholder?: string
    labelWidth?: string
    inputClass?: string
  }>(),
  {
    placeholder: "게시판",
    labelWidth: "w-16",
    inputClass: "max-w-28",
  },
)
</script>
