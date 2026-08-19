<template>
  <Dialog v-model:open="isMovePostDialog">
    <DialogContent class="sm:max-w-md" @escape-key-down="preventCloseWhileMoving">
      <DialogHeader>
        <DialogTitle>게시글 이동</DialogTitle>
        <DialogDescription>
          이 게시글을 옮길 목적지 게시판을 선택해 주세요.
        </DialogDescription>
      </DialogHeader>

      <div v-if="isLoadingMoveTargets" class="flex items-center gap-3 py-5 text-sm text-muted-foreground">
        <Spinner />
        이동 가능한 게시판을 확인하고 있습니다.
      </div>
      <div v-else-if="moveTargets.length === 0" class="py-5 text-sm text-muted-foreground">
        관리 권한이 있는 다른 게시판이 없습니다.
      </div>
      <CommonVSelect
        v-else
        v-model="moveTargetUid"
        :options="targetOptions"
        label="이동 가능한 게시판"
        placeholder="목적지 게시판 선택"
      />

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" class="cursor-pointer" :disabled="isMovingPost">취소</Button>
        </DialogClose>
        <Button
          class="cursor-pointer"
          :disabled="moveTargetUid < 1 || isLoadingMoveTargets || isMovingPost"
          @click="move"
        >
          <Spinner v-if="isMovingPost" />
          {{ isMovingPost ? "이동 중" : "이동하기" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"

const {
  isMovePostDialog,
  isLoadingMoveTargets,
  isMovingPost,
  moveTargets,
  moveTargetUid,
  move,
} = useNuboViewContext()

const targetOptions = computed(() =>
  moveTargets.value.map((board) => ({
    label: board.info
      ? `${recoverChars(board.name)} (${board.id}) · ${recoverChars(board.info)}`
      : `${recoverChars(board.name)} (${board.id})`,
    value: board.uid,
  })),
)

const preventCloseWhileMoving = (event: Event) => {
  if (isMovingPost.value) event.preventDefault()
}
</script>
