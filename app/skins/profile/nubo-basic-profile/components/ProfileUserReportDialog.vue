<template>
  <Dialog v-if="isDesktop" v-model:open="isOpenReportForm">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-100">
      <DialogHeader>
        <DialogTitle>사용자 신고</DialogTitle>
        <DialogDescription>신고 사유를 선택해 주세요</DialogDescription>
      </DialogHeader>
      <ReportForm />
    </DialogContent>
  </Dialog>

  <Drawer v-else v-model:open="isOpenReportForm">
    <DrawerTrigger as-child>
      <slot />
    </DrawerTrigger>
    <DrawerContent>
      <div class="mx-auto w-full max-w-sm">
        <DrawerHeader>
          <DrawerTitle>사용자 신고</DrawerTitle>
          <DrawerDescription>신고 사유를 선택해 주세요</DrawerDescription>
        </DrawerHeader>
        <div class="p-4">
          <ReportForm />
        </div>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import { useNuboProfileContext } from "~/types/nubo-skin-keys"
import ReportForm from "./ProfileReportForm.vue"

const isDesktop = useMediaQuery("(min-width: 768px)")
const { isOpenReportForm } = useNuboProfileContext()
</script>
