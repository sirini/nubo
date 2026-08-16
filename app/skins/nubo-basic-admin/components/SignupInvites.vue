<template>
  <section class="m-4 rounded-xl border bg-card p-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 class="flex items-center gap-2 font-semibold">
          <ShieldCheckIcon class="h-4 w-4" /> 가입 정책
        </h3>
        <p class="mt-1 text-sm text-muted-foreground">
          현재 모드: <strong>{{ modeLabel }}</strong>
        </p>
      </div>
      <code class="rounded-md bg-muted px-2 py-1 text-xs"
        >SIGNUP_MODE={{ status?.mode ?? "확인 중" }}</code
      >
    </div>

    <p class="mt-4 text-sm text-muted-foreground">
      <template v-if="status?.mode === 'verified_email'"
        >Resend 인증 메일을 확인한 사용자와 이메일을 확인한 소셜 계정의 신규 가입을
        허용합니다.</template
      >
      <template v-else-if="status?.mode === 'invite_only'"
        >관리자가 특정 이메일로 발급한 일회용 초대만 허용합니다. 소셜 로그인은 기존 회원에게만
        열립니다.</template
      >
      <template v-else-if="status?.mode === 'disabled'"
        >관리자 직접 추가를 제외한 모든 신규 가입을 차단합니다. 기존 회원 로그인은
        유지됩니다.</template
      >
    </p>
    <p class="mt-2 text-xs text-muted-foreground">
      모드는 서버 <code>.env</code>에서 변경한 뒤 GOAPI를 재시작해야 적용됩니다.
    </p>

    <div v-if="status?.mode === 'invite_only'" class="mt-5 border-t pt-5">
      <div class="grid gap-3 sm:grid-cols-[1fr_110px_auto]">
        <Input v-model="email" type="email" placeholder="초대할 회원 이메일" />
        <Input v-model.number="expiresDays" type="number" min="1" max="90" />
        <Button class="cursor-pointer text-foreground" :disabled="busy" @click="createInvite">
          <PlusIcon class="h-4 w-4" /> 초대 발급
        </Button>
      </div>
      <p class="mt-2 text-xs text-muted-foreground">
        유효기간은 일 단위(1~90일)입니다. 초대 링크 원문은 발급 직후에만 확인할 수 있습니다.
      </p>

      <div v-if="createdURL" class="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <p class="text-sm font-medium">이 링크를 초대할 사람에게 안전하게 전달하세요.</p>
        <div class="mt-2 flex gap-2">
          <Input :model-value="createdURL" readonly />
          <Button variant="outline" class="cursor-pointer" @click="copyCreatedURL"
            ><CopyIcon class="h-4 w-4" /> 복사</Button
          >
        </div>
      </div>

      <div class="mt-4 space-y-2">
        <div
          v-for="item in invites"
          :key="item.uid"
          class="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p class="font-medium">{{ item.email }}</p>
            <p class="text-xs text-muted-foreground">
              {{ formatDate(item.expires) }}까지 · {{ inviteState(item) }}
            </p>
          </div>
          <Button
            v-if="!item.used && !item.revoked && item.expires >= Date.now()"
            size="sm"
            variant="outline"
            class="cursor-pointer"
            @click="revokeInvite(item.uid)"
            >취소</Button
          >
        </div>
        <p v-if="!invites.length" class="py-3 text-sm text-muted-foreground">
          아직 발급한 초대가 없습니다.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CopyIcon, PlusIcon, ShieldCheckIcon } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { SignupInvite, SignupInviteCreated, SignupStatus } from "~/types/auth"
import type { Resp } from "~/types/common"

const config = useRuntimeConfig()
const { getSignupStatus } = useAuth()
const status = ref<SignupStatus | null>(null)
const invites = ref<SignupInvite[]>([])
const email = ref("")
const expiresDays = ref(7)
const createdURL = ref("")
const busy = ref(false)

const modeLabel = computed(() => {
  if (!status.value) return "확인 중"
  return { verified_email: "이메일 인증", invite_only: "초대 전용", disabled: "가입 중단" }[
    status.value.mode
  ]
})

const load = async () => {
  const response = await getSignupStatus()
  if (response.success) status.value = response.result
  if (status.value?.mode !== "invite_only") return
  const list = await $fetch<Resp<SignupInvite[]>>("/admin/user/invites", {
    baseURL: config.public.apiBase,
  })
  if (list.success) invites.value = list.result
}

const createInvite = async () => {
  busy.value = true
  try {
    const response = await $fetch<Resp<SignupInviteCreated>>("/admin/user/invite", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: { email: email.value, expiresDays: expiresDays.value },
    })
    if (!response.success) {
      toast(`❌ 초대를 발급하지 못했습니다: ${response.error}`)
      return
    }
    createdURL.value = response.result.url
    email.value = ""
    toast("✅ 일회용 초대를 발급했습니다. 지금 링크를 복사해 주세요.")
    await load()
  } catch (error) {
    toast(`❌ 초대를 발급하지 못했습니다: ${error}`)
  } finally {
    busy.value = false
  }
}

const revokeInvite = async (uid: number) => {
  const response = await $fetch<Resp<null>>(`/admin/user/invite/${uid}`, {
    baseURL: config.public.apiBase,
    method: "DELETE",
  })
  if (!response.success) {
    toast(`❌ 초대를 취소하지 못했습니다: ${response.error}`)
    return
  }
  toast("초대를 취소했습니다.")
  await load()
}

const copyCreatedURL = async () => {
  await navigator.clipboard.writeText(createdURL.value)
  toast("초대 링크를 복사했습니다.")
}

const formatDate = (value: number) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(value)
const inviteState = (item: SignupInvite) =>
  item.used
    ? "사용 완료"
    : item.revoked
      ? "취소됨"
      : item.expires < Date.now()
        ? "만료됨"
        : "사용 가능"

onMounted(async () => {
  try {
    await load()
  } catch (error) {
    toast(`❌ 가입 정책을 불러오지 못했습니다: ${error}`)
  }
})
</script>
