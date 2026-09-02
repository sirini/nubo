<template>
  <div class="space-y-6 p-4 sm:p-6">
    <header>
      <div class="flex items-center gap-2">
        <AwardIcon class="size-5 text-primary" />
        <h1 class="text-xl font-semibold">업적 배지</h1>
      </div>
      <p class="mt-1 text-sm text-muted-foreground">
        오래 간직할 만한 성취를 만들고 회원에게 직접 수여합니다.
      </p>
    </header>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">새 업적 만들기</CardTitle>
        <CardDescription>단계형 활동 수치나 현재 상태가 아닌, 영구적인 업적만 등록해 주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="badge-name">이름</Label>
              <Input id="badge-name" v-model="createForm.name" maxlength="100" placeholder="2026년 SENSTA 여름 사진전 우수상" />
            </div>
            <div class="space-y-2">
              <Label for="badge-description">설명</Label>
              <Textarea id="badge-description" v-model="createForm.description" maxlength="300" class="min-h-24 resize-none" placeholder="이 업적을 받은 이유를 짧게 설명해 주세요." />
            </div>
            <div class="flex flex-wrap items-center gap-5">
              <label class="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox v-model="createForm.showInline" />
                작성자 이름 옆에도 표시
              </label>
              <div class="flex items-center gap-2">
                <Label for="badge-order" class="whitespace-nowrap">정렬 순서</Label>
                <Input id="badge-order" v-model.number="createForm.sortOrder" type="number" min="0" class="w-24" />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <Label>아이콘</Label>
            <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
              <button
                v-for="option in ACHIEVEMENT_ICON_OPTIONS"
                :key="option.key"
                type="button"
                class="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border text-xs transition-colors"
                :class="createForm.iconKey === option.key ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'"
                @click="createForm.iconKey = option.key"
              >
                <UserBadgeIcon :badge="{ iconKey: option.key }" class="size-5" />
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter class="justify-end border-t pt-6">
        <Button :disabled="saving || createForm.name.trim().length < 2" class="gap-2" @click="createDefinition">
          <LoaderCircleIcon v-if="saving" class="size-4 animate-spin" />
          <PlusIcon v-else class="size-4" />
          업적 만들기
        </Button>
      </CardFooter>
    </Card>

    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">등록된 업적</h2>
        <span class="text-xs text-muted-foreground">{{ definitions.length }}개</span>
      </div>
      <div v-if="loading" class="flex min-h-32 items-center justify-center text-muted-foreground">
        <LoaderCircleIcon class="size-5 animate-spin" />
      </div>
      <div v-else class="grid gap-3 md:grid-cols-2">
        <Card v-for="definition in definitions" :key="definition.key" class="overflow-hidden">
          <CardContent class="flex items-start gap-3 p-4">
            <span class="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
              <UserBadgeIcon :badge="definition" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <strong class="truncate text-sm">{{ recoverChars(definition.name) }}</strong>
                <Badge variant="secondary">{{ definition.system ? "자동 업적" : "관리자 업적" }}</Badge>
                <Badge v-if="definition.showInline" variant="outline">이름 옆 표시</Badge>
              </div>
              <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ recoverChars(definition.description) || "설명이 없습니다." }}</p>
            </div>
            <Button v-if="!definition.system" type="button" size="icon" variant="ghost" aria-label="업적 수정" @click="openEdit(definition)">
              <PencilIcon class="size-4" />
            </Button>
            <LockKeyholeIcon v-else class="mt-2 size-4 shrink-0 text-muted-foreground" aria-label="자동 업적은 수정할 수 없습니다" />
          </CardContent>
        </Card>
      </div>
    </section>

    <Dialog v-model:open="editOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>업적 수정</DialogTitle>
          <DialogDescription>이미 수여된 회원의 진열장에도 변경 내용이 함께 반영됩니다.</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="space-y-2"><Label for="edit-badge-name">이름</Label><Input id="edit-badge-name" v-model="editForm.name" maxlength="100" /></div>
          <div class="space-y-2"><Label for="edit-badge-description">설명</Label><Textarea id="edit-badge-description" v-model="editForm.description" maxlength="300" class="min-h-24 resize-none" /></div>
          <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
            <button
              v-for="option in ACHIEVEMENT_ICON_OPTIONS"
              :key="option.key"
              type="button"
              class="flex aspect-square items-center justify-center rounded-lg border"
              :class="editForm.iconKey === option.key ? 'border-primary bg-primary/10 text-primary' : 'border-border'"
              :aria-label="option.label"
              @click="editForm.iconKey = option.key"
            ><UserBadgeIcon :badge="{ iconKey: option.key }" class="size-5" /></button>
          </div>
          <div class="flex flex-wrap items-center gap-5">
            <label class="flex cursor-pointer items-center gap-2 text-sm"><Checkbox v-model="editForm.showInline" />작성자 이름 옆에도 표시</label>
            <Input v-model.number="editForm.sortOrder" type="number" min="0" class="w-24" aria-label="정렬 순서" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editOpen = false">취소</Button>
          <Button :disabled="saving || editForm.name.trim().length < 2" @click="saveDefinition">저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { AwardIcon, LoaderCircleIcon, LockKeyholeIcon, PencilIcon, PlusIcon } from "lucide-vue-next"
import { toast } from "vue-sonner"
import { ACHIEVEMENT_ICON_OPTIONS } from "~/constants/achievement"
import type { AdminBadgeDefinition, AdminBadgeDefinitionParam } from "~/types/admin"

defineOptions({ name: "NuboAdminBadge" })

const { createBadgeDefinition, loadBadgeDefinitions, modifyBadgeDefinition } = useAdmin()
const definitions = ref<AdminBadgeDefinition[]>([])
const loading = ref(true)
const saving = ref(false)
const editOpen = ref(false)

const blankForm = (): AdminBadgeDefinitionParam => ({
  name: "",
  description: "",
  iconKey: "award",
  showInline: false,
  sortOrder: 100,
})
const createForm = reactive<AdminBadgeDefinitionParam>(blankForm())
const editForm = reactive<AdminBadgeDefinitionParam>(blankForm())

const refresh = async () => {
  loading.value = true
  try {
    const response = await loadBadgeDefinitions()
    if (!response.success) throw new Error(response.error)
    definitions.value = response.result
  } catch (error) {
    toast.error(`업적 목록을 불러오지 못했습니다: ${error}`)
  } finally {
    loading.value = false
  }
}

const createDefinition = async () => {
  saving.value = true
  try {
    const response = await createBadgeDefinition(createForm)
    if (!response.success) throw new Error(response.error)
    definitions.value.push(response.result)
    definitions.value.sort((a, b) => a.sortOrder - b.sortOrder || a.created - b.created)
    Object.assign(createForm, blankForm())
    toast.success("새 업적을 만들었습니다.")
  } catch (error) {
    toast.error(`업적을 만들지 못했습니다: ${error}`)
  } finally {
    saving.value = false
  }
}

const openEdit = (definition: AdminBadgeDefinition) => {
  Object.assign(editForm, {
    key: definition.key,
    name: recoverChars(definition.name),
    description: recoverChars(definition.description),
    iconKey: definition.iconKey,
    showInline: definition.showInline,
    sortOrder: definition.sortOrder,
  })
  editOpen.value = true
}

const saveDefinition = async () => {
  saving.value = true
  try {
    const response = await modifyBadgeDefinition(editForm)
    if (!response.success) throw new Error(response.error)
    const index = definitions.value.findIndex((item) => item.key === response.result.key)
    if (index >= 0) definitions.value[index] = { ...definitions.value[index], ...response.result }
    definitions.value.sort((a, b) => a.sortOrder - b.sortOrder || a.created - b.created)
    editOpen.value = false
    toast.success("업적 정보를 수정했습니다.")
  } catch (error) {
    toast.error(`업적을 수정하지 못했습니다: ${error}`)
  } finally {
    saving.value = false
  }
}

onMounted(refresh)
</script>
