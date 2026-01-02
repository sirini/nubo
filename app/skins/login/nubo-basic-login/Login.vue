<template>
  <section class="flex items-center justify-center min-h-[80vh]">
    <Card class="w-full rounded-lg overflow-hidden shadow-lg max-w-sm">
      <CardHeader>
        <CardTitle class="text-xl">로그인</CardTitle>
        <CardDescription>다시 오신 것을 환영합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-6">
          <form @submit="login">
            <FormField name="email" v-slot="{ componentField }">
              <FormItem class="mb-6">
                <FormLabel class="text-muted">이메일</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="example@sample.com" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField name="password" v-slot="{ componentField }">
              <FormItem class="mb-6">
                <FormLabel class="text-muted">비밀번호</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <CommonVTooltip content="아이디와 비밀번호를 입력하신 후 클릭해주세요!">
              <Button type="submit" class="w-full text-foreground cursor-pointer gap-2">
                <LogInIcon />
                로그인
              </Button>
            </CommonVTooltip>

            <div class="grid grid-cols-2 gap-3 mt-3">
              <CommonVTooltip content="본인 이메일 주소를 이용하여 인증 후 가입합니다">
                <NuxtLink to="/auth/join">
                  <Button type="button" variant="outline" class="w-full cursor-pointer gap-2">
                    <UserPlusIcon class="w-4 h-4" />
                    회원가입
                  </Button>
                </NuxtLink>
              </CommonVTooltip>

              <CommonVTooltip content="본인 이메일 주소를 이용하여 비밀번호를 초기화 합니다">
                <NuxtLink to="/auth/reset-password" as-child>
                  <Button type="button" variant="outline" class="w-full cursor-pointer gap-2">
                    <LockKeyholeOpenIcon class="w-4 h-4" />
                    비밀번호 초기화
                  </Button>
                </NuxtLink>
              </CommonVTooltip>
            </div>

            <div
              class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border my-6"
            >
              <span class="relative z-10 bg-background px-2 text-muted-foreground">
                혹은 소셜 로그인
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2 items-center">
              <CommonVTooltip content="구글 계정으로 로그인하기">
                <Button as-child variant="outline" class="w-full cursor-pointer">
                  <NuxtLink :href="oauthGoogleUrl" external>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      width="48"
                      height="48"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>

                    구글
                  </NuxtLink>
                </Button>
              </CommonVTooltip>

              <CommonVTooltip content="네이버 계정으로 로그인하기">
                <Button as-child variant="outline" class="w-full cursor-pointer">
                  <NuxtLink :href="oauthNaverUrl" external>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"
                        fill="#03C75A"
                      />
                    </svg>

                    네이버
                  </NuxtLink>
                </Button>
              </CommonVTooltip>

              <CommonVTooltip content="카카오 계정으로 로그인하기">
                <Button as-child variant="outline" class="w-full cursor-pointer">
                  <NuxtLink :href="oauthKakaoUrl" external>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#FEE500">
                      <path
                        d="M12 3c-5.523 0-10 3.53-10 7.885 0 2.815 1.872 5.285 4.687 6.68-.153.528-.984 3.4-1.017 3.624 0 0-.02.169.09.234a.3.3 0 0 0 .24.04c.315-.043 3.649-2.385 4.226-2.792A12.608 12.608 0 0 0 12 18.885c5.523 0 10-3.53 10-7.885S17.523 3 12 3z"
                      />
                    </svg>

                    카카오
                  </NuxtLink>
                </Button>
              </CommonVTooltip>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { LockKeyholeOpenIcon, LogInIcon, UserPlusIcon } from "lucide-vue-next"
import { useNuboLoginContext } from "~/types/nubo-skin-keys"

const { oauthGoogleUrl, oauthNaverUrl, oauthKakaoUrl, login } = useNuboLoginContext()
</script>
