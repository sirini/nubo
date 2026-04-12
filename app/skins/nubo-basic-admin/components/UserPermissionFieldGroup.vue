<template>
  <FieldGroup class="gap-3">
    <InputCheckbox name="login" label="로그인" description="로그인 허용 (체크 해제 시 차단됨)" />
    <InputCheckbox name="writePost" label="글쓰기" description="글쓰기 작업 허용" />
    <InputCheckbox name="writeComment" label="댓글쓰기" description="댓글 작성 작업 허용" />
    <InputCheckbox
      name="sendChatMessage"
      label="메시지"
      description="다른 사용자와 1:1 대화 허용"
    />
    <InputCheckbox
      name="sendReport"
      label="신고하기"
      description="다른 사용자를 신고할 수 있게 허용"
    />
  </FieldGroup>
</template>

<script setup lang="ts">
import InputCheckbox from "./InputCheckbox.vue"
</script>
