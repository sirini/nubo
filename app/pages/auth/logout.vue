<template>
  <section class="flex items-center justify-center min-h-screen py-4">
    <Card class="w-full rounded-lg overflow-hidden shadow-lg max-w-sm">
      <CardHeader>
        <CardTitle class="text-xl">로그아웃 완료</CardTitle>
        <CardDescription>성공적으로 로그아웃 하였습니다</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4">
          성공적으로 로그아웃 하였습니다. 이제 다시 로그인을 하러 가거나, 혹은 첫 화면으로 돌아갈 수
          있습니다. 어디로 가볼까요?

          <Button variant="default" class="w-full text-foreground" as-child>
            <NuxtLink href="/">첫 화면으로 이동</NuxtLink>
          </Button>
          <Button variant="outline" class="w-full" as-child>
            <NuxtLink href="/auth/login">로그인 하러가기</NuxtLink>
          </Button>
        </div>
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
const auth = useAuthStore()

await callOnce(async () => {
  await auth.logout()
})
</script>
