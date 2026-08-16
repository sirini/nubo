<template>
  <section class="flex items-center justify-center min-h-[calc(100dvh-70px)]">
    <Card class="w-full rounded-lg overflow-hidden shadow-lg max-w-sm">
      <CardHeader>
        <CardTitle class="text-xl">회원가입</CardTitle>
        <CardDescription>{{ description }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4">
          <FormField v-if="signupStatus?.mode === 'disabled'" name="disabled">
            <FormItem class="py-6 space-y-3">
              <p class="font-medium">현재 신규 회원가입을 받지 않습니다.</p>
              <p class="text-sm text-muted-foreground">
                기존 회원은 평소처럼 로그인할 수 있습니다.
              </p>
            </FormItem>
            <NuxtLink to="/auth/login" as-child>
              <Button variant="outline" class="w-full cursor-pointer">로그인 화면으로</Button>
            </NuxtLink>
          </FormField>

          <template v-else>
            <FormField v-if="isValidCode" name="completed">
              <FormItem class="py-6">
                <p>인증이 성공적으로 완료되었습니다.</p>
                <p>이제 로그인 하실 수 있습니다!</p>
              </FormItem>

              <CommonVTooltip content="여기를 클릭하여 로그인 화면으로 이동합니다">
                <NuxtLink to="/auth/login" as-child>
                  <Button variant="default" class="w-full gap-2 cursor-pointer text-foreground">
                    <LogInIcon class="w-4 h-4" />
                    로그인 하러가기
                  </Button>
                </NuxtLink>
              </CommonVTooltip>
            </FormField>

            <FormField
              v-if="isValidPassword && !isValidCode && signupStatus?.mode === 'verified_email'"
              name="code"
            >
              <FormItem>
                <InputOTP
                  v-model="verifyCode"
                  :maxlength="6"
                  class="mx-auto pt-2 pb-8"
                  @complete="verify"
                >
                  <InputOTPGroup>
                    <InputOTPSlot :index="0" />
                    <InputOTPSlot :index="1" />
                    <InputOTPSlot :index="2" />
                    <InputOTPSlot :index="3" />
                    <InputOTPSlot :index="4" />
                    <InputOTPSlot :index="5" />
                  </InputOTPGroup>
                </InputOTP>

                <Button
                  variant="default"
                  class="gap-2 cursor-pointer text-foreground"
                  @click="verify"
                >
                  <BadgeCheckIcon class="w-4 h-4" />
                  인증 완료하기
                </Button>
              </FormItem>
            </FormField>

            <FormField v-if="isValidName && !isValidPassword" name="password">
              <FormItem>
                <FormLabel class="text-muted">패스워드</FormLabel>
                <FormControl>
                  <Input
                    v-model="joinPassword"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    @keyup.enter="submit"
                  />
                  <Input
                    v-model="joinPassword2"
                    type="password"
                    placeholder="비밀번호를 한 번 더 입력하세요"
                    @keyup.enter="submit"
                  />
                </FormControl>
              </FormItem>
              <Button
                variant="default"
                class="gap-2 cursor-pointer text-foreground"
                @click="submit"
              >
                <SendIcon class="w-4 h-4" />
                {{
                  signupStatus?.mode === "invite_only"
                    ? "초대 확인 후 가입"
                    : "내 아이디로 인증 메일 요청"
                }}
              </Button>
            </FormField>

            <FormField v-if="isValidEmail && !isValidName" name="name">
              <FormItem class="mb-2">
                <FormLabel class="text-muted">닉네임</FormLabel>
                <FormControl>
                  <div class="flex items-center justify-between gap-2">
                    <Input
                      v-model="joinName"
                      type="text"
                      placeholder="사용하실 닉네임 입력"
                      @keyup.enter="isUsedName"
                    />
                    <Button
                      variant="default"
                      class="gap-2 cursor-pointer text-foreground"
                      @click="isUsedName"
                    >
                      <CheckIcon class="w-4 h-4" />
                      확인
                    </Button>
                  </div>
                </FormControl>
              </FormItem>
            </FormField>

            <FormField v-if="signupStatus?.mode === 'invite_only' && !isValidEmail" name="invite">
              <FormItem class="mb-2">
                <FormLabel class="text-muted">초대 코드</FormLabel>
                <FormControl>
                  <Input
                    v-model="inviteCode"
                    type="text"
                    placeholder="관리자에게 받은 초대 코드 또는 링크"
                  />
                </FormControl>
                <p class="text-xs text-muted-foreground">
                  초대 링크로 들어왔다면 자동으로 입력됩니다. 초대받은 이메일과 같은 주소로 가입해
                  주세요.
                </p>
              </FormItem>
            </FormField>

            <FormField v-if="!isValidEmail" name="email">
              <FormItem class="mb-2">
                <FormLabel class="text-muted">이메일</FormLabel>
                <FormControl>
                  <div class="flex items-center justify-between gap-2">
                    <Input
                      v-model="joinEmail"
                      type="email"
                      placeholder="example@sample.com"
                      @keyup.enter="isUsedEmail"
                    />
                    <Button
                      variant="default"
                      class="gap-2 cursor-pointer text-foreground"
                      @click="isUsedEmail"
                    >
                      <CheckIcon class="w-4 h-4" />
                      확인
                    </Button>
                  </div>
                </FormControl>
              </FormItem>
            </FormField>

            <CommonVTooltip content="입력 내용들을 모두 초기화하고 다시 처음부터 입력합니다">
              <Button variant="outline" class="gap-2 cursor-pointer" @click="clearJoinForm">
                <RotateCcwIcon class="w-4 h-4" />
                다시 입력하기
              </Button>
            </CommonVTooltip>
          </template>
        </div>
      </CardContent>
    </Card>

    <CommonVLoadingDialog v-model="isLoading" />
  </section>
</template>

<script setup lang="ts">
import { BadgeCheckIcon, CheckIcon, LogInIcon, RotateCcwIcon, SendIcon } from "lucide-vue-next"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp"
import { useNuboLoginContext } from "~/providers/contexts/login"

defineOptions({ name: "NuboJoin" })

const {
  joinEmail,
  joinName,
  joinPassword,
  joinPassword2,
  inviteCode,
  signupStatus,
  verifyCode,
  isLoading,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidCode,
  isUsedEmail,
  isUsedName,
  submit,
  clearJoinForm,
  verify,
  loadSignupStatus,
} = useNuboLoginContext()

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const token = typeof route.query.invite === "string" ? route.query.invite : ""
  if (token) {
    inviteCode.value = token
    await router.replace({ path: route.path, query: {} })
  }
  await loadSignupStatus()
})

const description = computed(() => {
  if (!signupStatus.value) return "가입 정책을 확인하고 있습니다"
  if (signupStatus.value.mode === "disabled") return "운영자가 회원가입을 잠시 중단했습니다"
  if (signupStatus.value.mode === "invite_only")
    return `관리자 초대가 있어야 가입할 수 있습니다 [${step.value}/4]`
  return `이메일로 본인 확인 후 가입이 완료됩니다 [${step.value}/5]`
})

const step = computed(() => {
  if (isValidCode.value) return signupStatus.value?.mode === "invite_only" ? 4 : 5
  else if (isValidPassword.value) return 4
  else if (isValidName.value) return 3
  else if (isValidEmail.value) return 2
  return 1
})
</script>
