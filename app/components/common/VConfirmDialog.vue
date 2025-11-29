<template>
  <AlertDialog v-model:open="model">
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
        <AlertDialogCancel class="cursor-pointer">{{ cancelText || "취소" }}</AlertDialogCancel>

        <CommonVTooltip content="주의 : 삭제 작업은 되돌릴 수 없습니다">
          <AlertDialogAction
            @click="emit('confirm')"
            :class="variant === 'destructive' ? 'bg-red-500 hover:bg-red-700' : ''"
            class="text-foreground cursor-pointer"
          >
            {{ confirmText || "확인" }}
          </AlertDialogAction>
        </CommonVTooltip>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
const model = defineModel<boolean>()

defineProps<{
  title?: string
  desc?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}>()

const emit = defineEmits(["confirm"])
</script>
