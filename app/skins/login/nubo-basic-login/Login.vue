<template>
  <section class="flex items-center justify-center min-h-[80vh] py-4">
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
                <FormLabel class="text-gray-500">이메일</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="example@sample.com" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField name="password" v-slot="{ componentField }">
              <FormItem class="mb-6">
                <FormLabel class="text-gray-500">비밀번호</FormLabel>
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

            <div
              class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border my-3"
            >
              <span class="relative z-10 bg-background px-2 text-muted-foreground">
                혹은 소셜 로그인
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2 items-center mb-3">
              <CommonVTooltip content="구글 계정으로 로그인하기">
                <Button as-child variant="outline" class="w-full my-3 cursor-pointer">
                  <NuxtLink :href="oauthGoogleUrl" external>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>

                    구글
                  </NuxtLink>
                </Button>
              </CommonVTooltip>

              <CommonVTooltip content="네이버 계정으로 로그인하기">
                <Button as-child variant="outline" class="w-full my-3 cursor-pointer">
                  <NuxtLink :href="oauthNaverUrl" external>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M4 22L4 2h7l7 14V2h4v20h-7L8 8v14H4z" fill="currentColor" />
                    </svg>

                    네이버
                  </NuxtLink>
                </Button>
              </CommonVTooltip>

              <CommonVTooltip content="카카오 계정으로 로그인하기">
                <Button as-child variant="outline" class="w-full my-3 cursor-pointer">
                  <NuxtLink :href="oauthKakaoUrl" external>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M20 2H4c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h6l4 4 0-4h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                        fill="currentColor"
                      />
                    </svg>

                    카카오
                  </NuxtLink>
                </Button>
              </CommonVTooltip>
            </div>

            <Button type="submit" class="w-full text-foreground cursor-pointer">로그인</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { useNuboLoginContext } from "~/types/nubo-skin-keys"

const { oauthGoogleUrl, oauthNaverUrl, oauthKakaoUrl, login } = useNuboLoginContext()
</script>
