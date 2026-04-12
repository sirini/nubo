<template>
  <div class="container mx-auto min-h-screen">
    <main class="flex items-center justify-center min-h-screen py-6">
      <Card class="w-full rounded-lg overflow-hidden shadow-lg max-w-sm">
        <CardHeader>
          <CardTitle class="text-xl">잘못된 접근</CardTitle>
          <CardDescription>입력하신 주소가 올바르지 않습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4">
            페이지 주소가 변경되었거나, 입력하신 주소에 오타가 있을 수 있습니다. 첫화면으로 돌아가서
            다시 찾아보시거나 혹은 상단의 메뉴 버튼들 중에서 원하시는 페이지가 있는지 찾아보시는 건
            어떨까요?

            <Button variant="default" class="w-full text-foreground" as-child>
              <NuxtLink href="/">첫 화면으로 이동</NuxtLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>

<script setup lang="ts"></script>
