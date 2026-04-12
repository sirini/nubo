<template>
  <VeeField v-slot="{ field, errors }" :name="name">
    <div class="flex items-center justify-center gap-4">
      <FieldLabel :for="name" :class="[labelWidth, 'justify-end text-muted-foreground']">
        {{ label }}
      </FieldLabel>

      <div :class="inputClass">
        <slot :field="field" :errors="errors">
          <Input
            :id="name"
            :model-value="field.value"
            @update:model-value="field.onChange"
            @blur="field.onBlur"
            :type="type"
            :placeholder="placeholder"
            :aria-invalid="!!errors.length"
            autocomplete="off"
            :disabled="disabled"
          />
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
    description?: string
    placeholder?: string
    type?: string
    labelWidth?: string
    inputClass?: string
    disabled?: boolean
  }>(),
  {
    labelWidth: "w-16",
    inputClass: "max-w-28",
    type: "text",
    disabled: false,
  },
)
</script>
