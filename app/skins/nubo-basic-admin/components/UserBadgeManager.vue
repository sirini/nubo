<template>
  <Card class="mt-6">
    <CardHeader class="flex-row items-start justify-between gap-4">
      <div>
        <CardTitle class="flex items-center gap-2 text-base"><AwardIcon class="size-4 text-primary" />보유 업적</CardTitle>
        <CardDescription class="mt-1">한 번 수여한 업적은 회원의 진열장에 계속 남습니다.</CardDescription>
      </div>
      <Button type="button" size="sm" class="shrink-0 gap-1.5" @click="openGrantDialog">
        <PlusIcon class="size-4" /> 배지 추가
      </Button>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="flex min-h-20 items-center justify-center text-muted-foreground"><LoaderCircleIcon class="size-5 animate-spin" /></div>
      <ul v-else-if="userBadges.length" class="grid gap-2 sm:grid-cols-2">
        <li v-for="badge in userBadges" :key="badge.key" class="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
          <span class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            <UserBadgeIcon :badge="badge" class="size-4" />
          </span>
          <span class="min-w-0"><strong class="block truncate text-sm">{{ recoverChars(badge.name) }}</strong><span class="block truncate text-xs text-muted-foreground">{{ recoverChars(badge.description) }}</span></span>
        </li>
      </ul>
      <div v-else class="rounded-xl border border-dashed px-4 py-7 text-center text-sm text-muted-foreground">아직 획득한 업적이 없습니다.</div>
    </CardContent>

    <Dialog v-model:open="grantOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>업적 수여</DialogTitle>
          <DialogDescription>수여할 업적을 선택해 주세요. 이미 획득한 업적은 목록에서 제외됩니다.</DialogDescription>
        </DialogHeader>
        <div class="max-h-[55vh] space-y-2 overflow-y-auto py-2">
          <button
            v-for="definition in availableDefinitions"
            :key="definition.key"
            type="button"
            class="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors"
            :class="selectedKey === definition.key ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/60'"
            @click="selectedKey = definition.key"
          >
            <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-primary ring-1 ring-border"><UserBadgeIcon :badge="definition" class="size-5" /></span>
            <span class="min-w-0 flex-1"><span class="flex flex-wrap items-center gap-2"><strong class="text-sm">{{ recoverChars(definition.name) }}</strong><Badge variant="secondary">{{ definition.system ? "자동 업적" : "관리자 업적" }}</Badge></span><span class="mt-1 block text-xs leading-5 text-muted-foreground">{{ recoverChars(definition.description) }}</span></span>
            <CheckCircle2Icon v-if="selectedKey === definition.key" class="mt-2 size-5 shrink-0 text-primary" />
          </button>
          <div v-if="!availableDefinitions.length" class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            수여할 수 있는 다른 업적이 없습니다.<br />업적 배지 메뉴에서 새 업적을 만들 수 있습니다.
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="grantOpen = false">취소</Button>
          <Button type="button" :disabled="!selectedKey || granting" @click="grantSelected">
            <LoaderCircleIcon v-if="granting" class="mr-2 size-4 animate-spin" />선택한 업적 수여
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<script setup lang="ts">
import { AwardIcon, CheckCircle2Icon, LoaderCircleIcon, PlusIcon } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { AdminBadgeDefinition } from "~/types/admin"
import type { UserBadge } from "~/types/user"

const props = defineProps<{ userUid: number }>()
const { grantBadge, loadBadgeDefinitions, loadUserBadges } = useAdmin()
const definitions = ref<AdminBadgeDefinition[]>([])
const userBadges = ref<UserBadge[]>([])
const loading = ref(true)
const granting = ref(false)
const grantOpen = ref(false)
const selectedKey = ref("")

const availableDefinitions = computed(() => {
  const owned = new Set(userBadges.value.map((badge) => badge.key))
  return definitions.value.filter((definition) => definition.active && !owned.has(definition.key))
})

const load = async () => {
  loading.value = true
  try {
    const [definitionResponse, userResponse] = await Promise.all([
      loadBadgeDefinitions(),
      loadUserBadges(props.userUid),
    ])
    if (!definitionResponse.success) throw new Error(definitionResponse.error)
    if (!userResponse.success) throw new Error(userResponse.error)
    definitions.value = definitionResponse.result
    userBadges.value = userResponse.result
  } catch (error) {
    toast.error(`업적 정보를 불러오지 못했습니다: ${error}`)
  } finally {
    loading.value = false
  }
}

const openGrantDialog = async () => {
  selectedKey.value = ""
  await load()
  grantOpen.value = true
}

const grantSelected = async () => {
  const definition = definitions.value.find((item) => item.key === selectedKey.value)
  if (!definition) return
  granting.value = true
  try {
    const response = await grantBadge({ userUid: props.userUid, badgeKey: definition.key })
    if (!response.success) throw new Error(response.error)
    if (!response.result) {
      toast.info("이미 획득한 업적입니다.")
    } else {
      toast.success(`‘${recoverChars(definition.name)}’ 업적을 수여했습니다.`)
    }
    await load()
    grantOpen.value = false
  } catch (error) {
    toast.error(`업적을 수여하지 못했습니다: ${error}`)
  } finally {
    granting.value = false
  }
}

onMounted(load)
</script>
