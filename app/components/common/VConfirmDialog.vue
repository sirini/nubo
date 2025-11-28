<template>
  <AlertDialog>
    <AlertDialogTrigger as-child>
      <slot />
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ title || "정말로 진행할까요?" }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ desc || "이 작업은 되돌릴 수 없습니다" }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ cancelText || "취소" }}</AlertDialogCancel>
        <AlertDialogAction
          @click="emit('confirm')"
          :class="variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''"
        >
          {{ confirmText || "확인" }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  desc?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}>()

const emit = defineEmits(["confirm"])
</script>
