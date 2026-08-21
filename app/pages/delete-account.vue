<template>
  <section
    class="container mx-auto flex min-h-[calc(100dvh-70px)] max-w-2xl items-center px-4 py-8 sm:px-6"
  >
    <Card class="w-full overflow-hidden border-destructive/25">
      <CardHeader class="gap-2 px-5 sm:px-7">
        <div class="mb-1 flex size-11 items-center justify-center rounded-full bg-destructive/10">
          <Trash2Icon class="size-5 text-destructive" />
        </div>
        <CardTitle class="text-xl leading-7">계정 및 데이터 삭제</CardTitle>
        <CardDescription class="max-w-xl leading-6">
          {{ config.public.title }} 계정과 연결된 데이터를 브라우저에서 직접 삭제할 수 있습니다.
        </CardDescription>
      </CardHeader>

      <CardContent v-if="deleted" class="space-y-6 px-5 sm:px-7">
        <div role="status" class="rounded-xl border border-border/70 bg-muted/30 p-4 sm:p-5">
          <div class="flex items-start gap-3">
            <CircleCheckIcon class="mt-0.5 size-5 shrink-0 text-primary" />
            <div class="space-y-1.5">
              <p class="font-semibold leading-6">삭제가 완료되었습니다</p>
              <p class="text-sm leading-6 text-muted-foreground">
                계정과 연결된 데이터는 복구할 수 없습니다.
              </p>
            </div>
          </div>
        </div>
        <Button as-child class="h-11 w-full">
          <NuxtLink to="/">첫 화면으로 이동</NuxtLink>
        </Button>
      </CardContent>

      <CardContent v-else-if="!auth.isLoggedIn" class="space-y-6 px-5 sm:px-7">
        <p class="text-sm leading-6 text-muted-foreground">
          계정 소유자를 확인하기 위해 먼저 로그인해야 합니다. 로그인 후 이 삭제 페이지로 자동으로
          돌아옵니다.
        </p>
        <Button as-child class="h-11 w-full">
          <NuxtLink to="/auth/login?redirect=/delete-account">로그인하고 계속</NuxtLink>
        </Button>
        <p class="text-xs leading-5 text-muted-foreground">
          로그인할 수 없다면 개인정보 처리방침에 표시된 관리자 이메일로 삭제를 요청할 수 있습니다.
        </p>
      </CardContent>

      <CardContent v-else class="space-y-6 px-5 sm:px-7">
        <div
          role="alert"
          class="rounded-xl border border-destructive/25 bg-destructive/5 p-4 sm:p-5"
        >
          <div class="flex items-start gap-3">
            <TriangleAlertIcon class="mt-0.5 size-5 shrink-0 text-destructive" />
            <div class="space-y-2">
              <p class="font-semibold leading-6 text-destructive">
                이 작업은 되돌릴 수 없습니다
              </p>
              <p class="text-sm leading-6 text-muted-foreground">
                작성한 사진과 게시글, 댓글, 좋아요, 1:1 대화, 알림, 프로필 및 로그인 정보가 영구
                삭제됩니다.
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
          <div class="space-y-1.5">
            <Label for="delete-confirmation" class="leading-6">
              확인을 위해 DELETE를 입력하세요
            </Label>
            <p class="text-xs leading-5 text-muted-foreground">
              영문 대문자로 정확하게 입력해야 삭제 버튼이 활성화됩니다.
            </p>
          </div>
          <Input
            id="delete-confirmation"
            v-model="confirmation"
            class="font-mono tracking-[0.18em]"
            autocomplete="off"
            autocapitalize="characters"
            maxlength="6"
            placeholder="DELETE"
            :spellcheck="false"
          />
        </div>

        <Button
          variant="destructive"
          class="h-11 w-full gap-2"
          :disabled="confirmation !== 'DELETE' || deleting"
          @click="deleteAccount"
        >
          <LoaderCircleIcon v-if="deleting" class="size-4 animate-spin" />
          <Trash2Icon v-else class="size-4" />
          계정과 모든 데이터 영구 삭제
        </Button>
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
import {
  CircleCheckIcon,
  LoaderCircleIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-vue-next"
import { toast } from "vue-sonner"

defineOptions({ name: "NuboDeleteAccountPage" })

const config = useRuntimeConfig()
const auth = useAuthStore()
const confirmation = ref("")
const deleting = ref(false)
const deleted = ref(false)

const deleteAccount = async () => {
  if (confirmation.value !== "DELETE" || deleting.value) return

  deleting.value = true
  try {
    const response = await auth.deleteAccount()
    if (!response.success) {
      toast(`❌ 계정을 삭제하지 못했습니다: ${response.error}`)
      return
    }
    deleted.value = true
  } catch (error) {
    toast(`❌ 계정을 삭제하지 못했습니다: ${error}`)
  } finally {
    deleting.value = false
  }
}
</script>
