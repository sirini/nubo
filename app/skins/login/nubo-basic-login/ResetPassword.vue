<template>
  <section class="flex items-center justify-center min-h-[80vh]">
    <Card class="w-full rounded-lg overflow-hidden shadow-lg max-w-sm">
      <CardHeader>
        <CardTitle class="text-xl">비밀번호 초기화</CardTitle>
        <CardDescription>아이디(이메일 주소)를 입력하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-2">
          <FormField name="requestedReset" v-if="isRequestedReset">
            <FormItem class="py-6">
              <p>비밀번호 초기화 안내 메일을 발송하였습니다</p>
              <p>메일함을 확인하세요!</p>
            </FormItem>
          </FormField>

          <FormField name="resetPassword" v-else>
            <FormItem>
              <FormLabel class="text-muted">아이디</FormLabel>
              <FormControl>
                <Input
                  v-model="joinEmail"
                  type="email"
                  placeholder="아이디(이메일 주소)를 입력하세요"
                  @keyup.enter="requestResetPassword"
                />
              </FormControl>
            </FormItem>

            <CommonVTooltip content="사용하시는 메일에 초기화 관련 안내를 발송합니다">
              <Button
                variant="default"
                class="gap-2 cursor-pointer text-foreground mt-6"
                @click="requestResetPassword"
              >
                <MailIcon class="w-4 h-4" />
                비밀번호 초기화 요청 보내기
              </Button>
            </CommonVTooltip>
          </FormField>
        </div>
      </CardContent>
    </Card>

    <CommonVLoadingDialog v-model="isLoading" />
  </section>
</template>

<script setup lang="ts">
import { MailIcon } from "lucide-vue-next"
import { useNuboLoginContext } from "~/types/nubo-skin-keys"

const { isLoading, joinEmail, isRequestedReset, requestResetPassword } = useNuboLoginContext()
</script>
