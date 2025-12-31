<template>
  <section class="flex items-center justify-center min-h-[80vh]">
    <Card class="w-full rounded-lg overflow-hidden shadow-lg max-w-sm">
      <CardHeader>
        <CardTitle class="text-xl">회원가입</CardTitle>
        <CardDescription>이메일로 본인 확인 후 가입이 완료됩니다</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-6">
          <FormField name="email">
            <FormItem class="mb-6">
              <FormLabel class="text-muted">이메일</FormLabel>
              <FormControl>
                <Input type="email" placeholder="example@sample.com" />
                <Button variant="default" class="gap-2 cursor-pointer text-foreground">
                  <SendIcon class="w-4 h-4" />
                  전송
                </Button>
              </FormControl>
            </FormItem>
          </FormField>
        </div>
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { SendIcon } from "lucide-vue-next"

const emailAddress = ref<string>("")
</script>
