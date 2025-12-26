<template>
  <Sheet>
    <SheetTrigger as-child>
      <slot />
    </SheetTrigger>

    <SheetContent side="right" class="w-full sm:max-w-sm overflow-y-auto">
      <SheetHeader class="text-left">
        <SheetTitle>프로필 수정</SheetTitle>
        <SheetDescription> 다른 사용자에게 보여질 정보를 여기에서 수정합니다 </SheetDescription>
      </SheetHeader>

      <div class="grid gap-2 py-6 px-4">
        <div class="flex flex-col items-center gap-4 mb-6">
          <Avatar class="w-32 h-32 border-2 border-primary/10">
            <AvatarImage :src="profile" alt="Profile Preview" />
            <AvatarFallback>{{ nickname.substring(0, 2) }}</AvatarFallback>
          </Avatar>

          <input
            type="file"
            ref="fileInput"
            class="hidden"
            accept="image/*"
            @change="changeProfileImage"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            @click="triggerFileInput"
            class="cursor-pointer"
            >사진 변경</Button
          >
        </div>

        <div class="grid grid-cols-2 gap-2">
          <Label for="password1" class="text-muted-foreground">새 비밀번호</Label>
          <CommonVTooltip content="비밀번호 변경을 원하지 않을 경우 빈 칸으로 두시면 됩니다">
            <Input id="password1" v-model="password1" type="password" />
          </CommonVTooltip>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <Label for="password2" class="text-muted-foreground">새 비밀번호 확인</Label>
          <CommonVTooltip
            content="새 비밀번호는 8글자 이상, 영문/숫자/특수기호 조합으로 지정하세요"
          >
            <Input id="password2" v-model="password2" type="password" />
          </CommonVTooltip>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <Label for="nickname" class="text-muted-foreground">닉네임</Label>
          <Input id="nickname" v-model="nickname" placeholder="닉네임을 입력하세요" />
        </div>

        <div class="grid gap-2 mt-3">
          <Label for="signature" class="text-muted-foreground">서명글</Label>
          <Textarea
            id="signature"
            v-model="signature"
            placeholder="자신을 한 줄로 표현해 보세요"
            class="resize-none h-24"
          />
        </div>
      </div>

      <SheetFooter class="flex-col sm:flex-row">
        <Button
          type="submit"
          class="w-full text-foreground cursor-pointer flex items-center gap-2"
          @click="updateMyProfile"
        >
          <Spinner v-if="auth.isLoading" />
          <CheckCircle2Icon v-else class="w-4 h-4" />
          변경사항 저장하기</Button
        >
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { CheckCircle2Icon } from "lucide-vue-next"
import { toast } from "vue-sonner"

const auth = useAuthStore()
const password1 = ref<string>("")
const password2 = ref<string>("")
const nickname = ref<string>(recoverChars(auth.user.name))
const profile = ref<string>(auth.user.profile)
const signature = ref<string>(recoverChars(auth.user.signature))
const newProfile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// 사진 변경 버튼 클릭 시 숨겨둔 input 클릭하기
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 프로필 사진 변경 시 이미지 미리보기
const changeProfileImage = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    profile.value = URL.createObjectURL(target.files[0])
    newProfile.value = target.files[0]
  }
}

// 내 프로필 업데이트
const updateMyProfile = async () => {
  if (password1.value.length > 0 || password2.value.length > 0) {
    const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!pwRegex.test(password1.value) || !pwRegex.test(password2.value)) {
      toast(`⚠️ 비밀번호는 8글자 이상, 영문/숫자/특수기호 조합으로 입력해 주세요`)
      password1.value = ""
      password2.value = ""
      return
    }

    if (password1.value !== password2.value) {
      toast(`⚠️ 입력하신 새 비밀번호가 서로 다릅니다`)
      return
    }
  }

  if (nickname.value.length < 2 || nickname.value.length > 9) {
    toast(`⚠️ 닉네임은 2글자 이상 10글자 미만으로 작성해주세요`)
    return
  }

  auth.user.profile = profile.value
  auth.otherUser.profile = profile.value
  await auth.update(nickname.value, signature.value, password1.value, newProfile.value)
}
</script>
