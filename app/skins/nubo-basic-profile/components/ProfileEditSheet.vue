<template>
  <Sheet>
    <CommonVTooltip content="내 프로필을 수정합니다">
      <SheetTrigger as-child>
        <slot />
      </SheetTrigger>
    </CommonVTooltip>

    <SheetContent side="right" class="w-full sm:max-w-sm overflow-y-auto">
      <SheetHeader class="text-left">
        <SheetTitle>프로필 수정</SheetTitle>
        <SheetDescription> 다른 사용자에게 보여질 정보를 여기에서 수정합니다 </SheetDescription>
      </SheetHeader>

      <div class="grid gap-2 py-6 px-4">
        <div class="flex flex-col items-center gap-4 mb-6">
          <Avatar class="w-32 h-32 border-2 border-primary/10">
            <AvatarImage :src="editProfile.profile" alt="Profile Preview" />
            <AvatarFallback>{{ editProfile.nickname.substring(0, 2) }}</AvatarFallback>
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

        <div class="grid grid-cols-2 gap-2">
          <Label for="password1" class="text-muted-foreground">새 비밀번호</Label>
          <CommonVTooltip content="비밀번호 변경을 원하지 않을 경우 빈 칸으로 두시면 됩니다">
            <Input id="password1" v-model="editProfile.password1" type="password" />
          </CommonVTooltip>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <Label for="password2" class="text-muted-foreground">새 비밀번호 확인</Label>
          <CommonVTooltip
            content="새 비밀번호는 8글자 이상, 영문/숫자/특수기호 조합으로 지정하세요"
          >
            <Input id="password2" v-model="editProfile.password2" type="password" />
          </CommonVTooltip>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <Label for="nickname" class="text-muted-foreground">닉네임</Label>
          <Input id="nickname" v-model="editProfile.nickname" placeholder="닉네임을 입력하세요" />
        </div>

        <div class="grid gap-2 mt-3">
          <Label for="signature" class="text-muted-foreground">서명글</Label>
          <Textarea
            id="signature"
            v-model="editProfile.signature"
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
          <Spinner v-if="isLoading" />
          <CheckCircle2Icon v-else class="w-4 h-4" />
          변경사항 저장하기</Button
        >
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { CheckCircle2Icon } from "lucide-vue-next"
import { useNuboProfileContext } from "~/providers/contexts/profile"

const fileInputRef = ref<HTMLInputElement | null>(null)

// 프로필 사진 선택하기
const selectProfileImage = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = ""
    fileInputRef.value?.click()
  }
}

const { isLoading, editProfile, changeProfileImage, updateMyProfile } = useNuboProfileContext()
</script>
