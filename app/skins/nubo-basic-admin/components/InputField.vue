<template>
  <VeeField v-slot="{ field, errors }" :name="name">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <FieldLabel :for="name" :class="[labelWidth, 'justify-start text-muted-foreground sm:justify-end']">
        {{ label }}
      </FieldLabel>

      <div :class="inputClass">
        <slot :field="field" :errors="errors">
          <Input
            :id="name"
            :model-value="field.value"
            :type="type"
            :placeholder="placeholder"
            :aria-invalid="!!errors.length"
            autocomplete="off"
            :disabled="disabled"
            @update:model-value="field.onChange"
            @blur="field.onBlur"
          />
        </slot>
      </div>

      <FieldDescription class="flex-1">
        <span v-if="!errors.length" class="text-muted-foreground">
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
    description?: string
    placeholder?: string
    type?: string
    labelWidth?: string
    inputClass?: string
    disabled?: boolean
  }>(),
  {
    labelWidth: "w-full sm:w-16",
    inputClass: "w-full sm:max-w-28",
    type: "text",
    disabled: false,
  },
)
</script>
