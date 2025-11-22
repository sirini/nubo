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
import { AlertDialog } from "@/components/ui/alert-dialog"
import AlertDialogTrigger from "../ui/alert-dialog/AlertDialogTrigger.vue"
import AlertDialogContent from "../ui/alert-dialog/AlertDialogContent.vue"
import AlertDialogHeader from "../ui/alert-dialog/AlertDialogHeader.vue"
import AlertDialogTitle from "../ui/alert-dialog/AlertDialogTitle.vue"
import AlertDialogDescription from "../ui/alert-dialog/AlertDialogDescription.vue"
import AlertDialogFooter from "../ui/alert-dialog/AlertDialogFooter.vue"
import AlertDialogCancel from "../ui/alert-dialog/AlertDialogCancel.vue"
import AlertDialogAction from "../ui/alert-dialog/AlertDialogAction.vue"

defineProps<{
  title?: string
  desc?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}>()

const emit = defineEmits(["confirm"])
</script>
