<template>
  <VeeField v-slot="{ field, errors }" :name="name">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <FieldLabel
        :for="name"
        :class="[labelWidth, 'mt-0 shrink-0 justify-start text-muted-foreground sm:mt-2 sm:justify-end']"
      >
        {{ label }}
      </FieldLabel>

      <div class="flex flex-col flex-1 gap-1.5">
        <div :class="inputClass">
          <slot :field="field" :errors="errors">
            <Textarea
              :id="name"
              :model-value="field.value"
              :placeholder="placeholder"
              :aria-invalid="!!errors.length"
              :disabled="disabled"
              :rows="rows"
              class="resize-y"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
            />
          </slot>
        </div>

        <FieldDescription>
          <span v-if="!errors.length" class="text-xs text-muted-foreground/70">
            {{ description }}
          </span>
          <span v-else class="text-xs text-red-400 font-medium">
            {{ errors[0] }}
          </span>
        </FieldDescription>
      </div>
    </div>
  </VeeField>
</template>

<script setup lang="ts">
import { Textarea } from "@/components/ui/textarea"
import { Field as VeeField } from "vee-validate"

interface Props {
  name: string
  label: string
  description?: string
  placeholder?: string
  labelWidth?: string
  inputClass?: string
  disabled?: boolean
  rows?: number
}

withDefaults(defineProps<Props>(), {
  labelWidth: "w-full sm:w-16",
  inputClass: "w-full",
  disabled: false,
  rows: 5,
})
</script>
