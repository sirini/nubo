<template>
  <Field v-slot="{ field, handleChange, errors }" :name="name" orientation="horizontal">
    <div class="flex flex-wrap items-center gap-3 sm:gap-4">
      <FieldLabel :for="name" :class="[labelWidth, 'justify-end text-muted-foreground']">
        {{ label }}
      </FieldLabel>
      <Checkbox
        :id="name"
        :model-value="field.value"
        @update:model-value="handleChange"
        @blur="field.onBlur"
      />
      <FieldContent>
        <FieldDescription class="flex-1">
          <label class="text-muted cursor-pointer" :for="name">
            {{ description }}
          </label>
        </FieldDescription>
      </FieldContent>
    </div>
  </Field>
</template>

<script setup lang="ts">
import { Field } from "vee-validate"

withDefaults(
  defineProps<{
    name: string
    label: string
    description?: string
    labelWidth?: string
  }>(),
  {
    description: "",
    labelWidth: "w-16",
  },
)
</script>
