<template>
  <section class="flex items-center justify-center min-h-[calc(100dvh-70px)]">
    <Card class="w-full rounded-lg overflow-hidden shadow-lg max-w-sm">
      <CardHeader>
        <CardTitle class="text-xl">비밀번호 초기화</CardTitle>
        <CardDescription>새 비밀번호를 입력하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-2">
          <FormField name="newPassword">
            <FormItem>
              <FormLabel class="text-muted">새 비밀번호</FormLabel>
              <FormControl>
                <Input
                  v-model="resetPassword"
                  type="password"
                  placeholder="새 비밀번호를 입력하세요"
                  @keyup.enter="updateUserPassword"
                />
                <Input
                  v-model="resetPassword2"
                  type="password"
                  placeholder="새 비밀번호를 한 번 더 입력하세요"
                  @keyup.enter="updateUserPassword"
                />
              </FormControl>
            </FormItem>

            <CommonVTooltip content="변경하시는 비밀번호를 잘 기억해주세요!">
              <Button
                variant="default"
                class="gap-2 cursor-pointer text-foreground mt-6"
                @click="updateUserPassword"
              >
                <CheckIcon class="w-4 h-4" />
                비밀번호 업데이트하기
              </Button>
            </CommonVTooltip>

            <CommonVTooltip content="비밀번호가 혹시 기억나셨나요? 걱정말고 로그인 해보세요!">
              <NuxtLink to="/auth/login" as-child>
                <Button variant="outline" class="w-full gap-2 cursor-pointer text-foreground">
                  <LogInIcon class="w-4 h-4" />
                  로그인 화면으로 이동하기
                </Button>
              </NuxtLink>
            </CommonVTooltip>
          </FormField>
        </div>
      </CardContent>
    </Card>

    <CommonVLoadingDialog v-model="isLoading" />
  </section>
</template>

<script setup lang="ts">
import { CheckIcon, LogInIcon } from "lucide-vue-next"
import { useNuboLoginContext } from "~/types/nubo-skin-keys"

const { isLoading, resetPassword, resetPassword2, updateUserPassword } = useNuboLoginContext()
</script>
