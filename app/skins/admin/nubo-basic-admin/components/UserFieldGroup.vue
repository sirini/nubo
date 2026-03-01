<template>
  <FieldGroup class="gap-3">
    <div class="flex flex-col items-center gap-4 mb-6">
      <Avatar class="w-32 h-32 border-2 border-primary/10">
        <AvatarImage :src="values.oldProfile" alt="Profile Preview" />
        <AvatarFallback>{{ values.name.substring(0, 2) }}</AvatarFallback>
      </Avatar>

      <input
        type="file"
        ref="fileInputRef"
        class="hidden"
        accept="image/*"
        @change="changeProfileImage"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        @click="selectProfileImage"
        class="cursor-pointer"
        >사진 변경</Button
      >
    </div>

    <InputField
      name="id"
      label="ID"
      description="이메일 주소 입력"
      placeholder="tsboard@nubohub.org"
      input-class="max-w-48"
    />

    <InputField name="name" label="이름" description="닉네임 입력" placeholder="홍길동" />

    <InputField name="password" label="비밀번호" description="비밀번호 입력" type="password" />

    <InputField
      name="confirmPassword"
      label="비번확인"
      description="비밀번호 재확인"
      type="password"
    />

    <InputSelect name="level" label="레벨" description="사용자 레벨 지정" :items="levels" />

    <InputField name="point" label="포인트" description="사용자 포인트 지정" placeholder="100" />

    <InputField
      name="signature"
      label="서명"
      description="사용자 서명"
      placeholder=""
      input-class="max-w-48"
    />
  </FieldGroup>
</template>

<script setup lang="ts">
import { useFormValues } from "vee-validate"
import InputField from "./InputField.vue"
import InputSelect from "./InputSelect.vue"

const values = useFormValues()
const isModifying = computed(() => values.value.userUid > 1)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 레벨 제한 목록
let levels = []
for (let lv = 1; lv < 11; lv++) {
  levels.push({ name: `Lv. ${lv}`, value: lv })
}

// 프로필 사진 선택하기
const selectProfileImage = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = ""
    fileInputRef.value?.click()
  }
}

// 프로필 이미지 변경
const changeProfileImage = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    values.value.profile = target.files[0]
    values.value.oldProfile = URL.createObjectURL(target.files[0])
  }
}
</script>
