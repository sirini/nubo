<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
    <FieldLabel class="w-full justify-start text-muted-foreground sm:w-16 sm:justify-end sm:pt-2">{{ label }}</FieldLabel>
    <div class="w-full space-y-2 sm:max-w-72">
      <div class="flex gap-2">
        <Input v-model="query" placeholder="이름 2글자 이상" @keyup.enter="search" />
        <Button type="button" variant="outline" :disabled="query.trim().length < 2" @click="search">검색</Button>
      </div>
      <div v-if="chosenName || modelValue" class="rounded-md border bg-muted/35 px-3 py-2 text-sm">
        선택: {{ chosenName || `사용자 #${modelValue}` }}
      </div>
      <div v-if="candidates.length" class="max-h-40 overflow-y-auto rounded-md border p-1">
        <button
          v-for="candidate in candidates"
          :key="candidate.uid"
          type="button"
          class="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted"
          @click="select(candidate)"
        >
          <Avatar class="size-7"><AvatarImage :src="candidate.profile" /><AvatarFallback>{{ candidate.name.slice(0, 1) }}</AvatarFallback></Avatar>
          <span>{{ candidate.name }}</span><span class="ml-auto text-xs text-muted-foreground">#{{ candidate.uid }}</span>
        </button>
      </div>
      <p v-if="error" class="text-sm font-medium text-red-400">{{ error }}</p>
    </div>
    <FieldDescription class="flex-1 text-muted-foreground">이름으로 검색해 관리자를 지정합니다</FieldDescription>
  </div>
</template>

<script setup lang="ts">
import type { BoardWriter } from "~/types/board"
import { useNuboAdminContext } from "~/providers/contexts/admin"

const props = withDefaults(defineProps<{ scope: "board" | "group"; label?: string; modelValue: number; selectedName?: string; error?: string }>(), { label: "관리자", selectedName: "", error: "" })
const emit = defineEmits<{ (e: "update:modelValue", value: number): void; (e: "select", value: BoardWriter): void }>()
const { searchAdminCandidates } = useNuboAdminContext()
const query = ref("")
const candidates = ref<BoardWriter[]>([])
const chosenName = ref(props.selectedName)
watch(() => props.selectedName, (name) => { chosenName.value = name })

const search = async () => { candidates.value = await searchAdminCandidates(props.scope, query.value) }
const select = (candidate: BoardWriter) => {
  chosenName.value = candidate.name
  emit("update:modelValue", candidate.uid)
  emit("select", candidate)
  candidates.value = []
  query.value = candidate.name
}
</script>
