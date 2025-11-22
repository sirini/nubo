<template>
  <section class="flex items-center justify-center min-h-screen py-4">
    <Card class="w-full rounded-lg overflow-hidden shadow-lg max-w-sm">
      <CardHeader>
        <CardTitle class="text-xl">로그인</CardTitle>
        <CardDescription>다시 오신 것을 환영합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-6">
          <form @submit="onSubmit">
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

            <Button as-child variant="outline" class="w-full my-3">
              <NuxtLink :href="google" external>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>

                구글 계정으로 로그인
              </NuxtLink>
            </Button>

            <Button type="submit" class="w-full text-foreground cursor-pointer">로그인</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import * as z from "zod"
import { FormField } from "~/components/ui/form"
import FormControl from "~/components/ui/form/FormControl.vue"
import FormItem from "~/components/ui/form/FormItem.vue"
import FormLabel from "~/components/ui/form/FormLabel.vue"
import FormMessage from "~/components/ui/form/FormMessage.vue"

const route = useRoute()
const auth = useAuthStore()
const config = useRuntimeConfig()
const google = `${config.public.goapi}/auth/google/request`
const naver = `${config.public.goapi}/auth/naver/request`
const kakao = `${config.public.goapi}/auth/kakao/request`

const loginSchema = toTypedSchema(
  z.object({
    email: z
      .string()
      .min(5, "이메일 주소는 5글자 이상이어야 합니다.")
      .email("유효한 이메일 주소가 아닙니다."),
    password: z.string().min(8, "비밀번호는 8글자 이상이어야 합니다."),
  }),
)

const { handleSubmit } = useForm({
  validationSchema: loginSchema,
  initialValues: {
    email: "",
    password: "",
  },
})

const onSubmit = handleSubmit(({ email, password }) => {
  const redirect = (route.query.redirect as string) || "/"
  auth.login(email, password, redirect)
})
</script>
