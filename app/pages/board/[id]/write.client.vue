<template>
  <section class="container mx-auto py-4">
    <Card>
      <CardHeader>
        <CardTitle>새글쓰기</CardTitle>
        <CardDescription>{{ edit.config.name }} : {{ edit.config.info }}</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <div class="flex items-center gap-6">
          <div v-if="auth.isAdmin" class="flex items-center space-x-2">
            <Checkbox id="notice" v-model:checked="edit.isNotice" />
            <Label for="notice" class="cursor-pointer font-normal text-muted-foreground"
              >공지글로 설정</Label
            >
          </div>

          <div class="flex items-center space-x-2">
            <Checkbox id="secret" v-model:checked="edit.isSecret" />
            <Label for="secret" class="cursor-pointer font-normal text-muted-foreground"
              >비밀글로 설정</Label
            >
          </div>
        </div>

        <div v-if="edit.categories.length > 0">
          <CommonVSelect
            v-model="edit.categoryUid"
            placeholder="게시글 분류 선택"
            :options="sc"
          ></CommonVSelect>
        </div>

        <div
          @click="triggerAttach"
          @dragover.prevent="edit.isDragging = true"
          @dragenter.prevent="edit.isDragging = true"
          @dragleave.prevent="edit.isDragging = false"
          @drop.prevent="edit.dropAttaches"
          class="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 hover:border-accent cursor-pointer transition-all"
          :class="[
            edit.isDragging
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-accent/50 hover:border-accent',
          ]"
        >
          <UploadCloudIcon class="w-8 h-8 mb-2 opacity-70" />
          <p class="text-sm font-medium">클릭하여 파일을 선택하세요</p>
          <p class="text-xs text-muted-foreground/70">또는 파일을 여기로 드래그하세요</p>
          <input
            ref="attach"
            type="file"
            multiple
            class="hidden"
            @change="edit.handleAttachChange"
          />
        </div>

        <div
          v-if="edit.attaches.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
        >
          <div
            v-for="(file, index) in edit.attaches"
            :key="index"
            class="flex items-center justify-between p-2 border rounded text-sm bg-card"
          >
            <div class="flex items-center gap-2 truncate">
              <FileIcon class="w-4 h-4 text-blue-500" />
              <span class="truncate">{{ file.name }}</span>
              <span class="text-xs text-muted-foreground"
                >({{ showReadableNumber(file.size) }}B)</span
              >
            </div>
            <Button variant="ghost" size="icon" class="w-6 h-6" @click="edit.removeAttach(index)">
              <XIcon class="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div class="relative">
          <Input
            v-model="edit.title"
            placeholder="제목을 입력하세요"
            class="text-lg font-medium"
            autocomplete="off"
          />

          <div
            v-if="edit.titleSuggestions.length > 0 || edit.isSearchingTitles"
            class="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden"
          >
            <div
              v-if="edit.isSearchingTitles"
              class="p-2 text-sm text-muted-foreground flex items-center"
            >
              <Loader2Icon class="w-4 h-4 animate-spin mr-2" /> 검색 중...
            </div>
            <ul v-else-if="edit.titleSuggestions.length > 0" class="py-1">
              <li
                v-for="(item, index) in edit.titleSuggestions"
                :key="index"
                class="px-3 py-2 text-sm text-blue-300 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                @click="edit.selectTitle(item)"
              >
                {{ item }}
              </li>
              <li
                class="border-t px-3 py-2 text-sm flex items-center justify-between cursor-pointer"
                @click="edit.titleSuggestions = []"
              >
                <span>유사한 제목들 목록 닫기</span>
                <XIcon class="w-4 h-4" />
              </li>
            </ul>
          </div>
        </div>

        <EditorTiptapEditor v-model="edit.content" :config="edit.config" />

        <div
          class="flex flex-wrap gap-2 p-3 border rounded-md bg-background min-h-[50px] items-center focus-within:ring-1 focus-within:ring-ring"
        >
          <Badge
            v-for="(tag, index) in edit.tags"
            :key="index"
            variant="secondary"
            class="pl-2 pr-2 py-1 text-sm flex items-center gap-1 cursor-pointer"
            @click="edit.removeTag(index)"
          >
            {{ tag }}
          </Badge>

          <div class="relative flex-1 min-w-[120px]">
            <CommonVTooltip content="해시태그는 특수기호 및 공백을 허용하지 않습니다">
              <Input
                v-model="edit.tag"
                class="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                placeholder="태그입력 (엔터)"
                @keydown.enter.prevent="edit.addTag"
                @keydown.tab.prevent="edit.addTag"
                @keydown.comma.prevent="edit.addTag"
              />
            </CommonVTooltip>

            <div
              v-if="edit.tagSuggestions.length > 0"
              class="absolute bottom-full mb-1 left-0 w-48 bg-popover border rounded-md shadow-md z-10"
            >
              <div
                v-for="(item, idx) in edit.tagSuggestions"
                :key="idx"
                class="px-4 py-3 text-sm hover:bg-accent cursor-pointer flex items-center justify-between"
                @click="selectSuggestedTag(item.name)"
              >
                <span class="text-blue-300">{{ item.name }}</span>
                <span class="text-muted-foreground">{{ item.count }}회</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter class="flex justify-between items-center border-t">
        <CommonVTooltip content="클릭하시면 작성하시던 내용은 모두 삭제됩니다">
          <Button variant="outline" @click="$router.back()" class="cursor-pointer">취소</Button>
        </CommonVTooltip>

        <CommonVTooltip content="제출하시기 전에 글내용을 다시 한 번 살펴봐주세요">
          <Button @click="edit.submit" class="text-foreground cursor-pointer">제출하기</Button>
        </CommonVTooltip>
      </CardFooter>
    </Card>

    <CommonVLoadingDialog message="게시글을 저장하고 있습니다" />
  </section>
</template>

<script setup lang="ts">
import { FileIcon, Loader2Icon, UploadCloudIcon, XIcon } from "lucide-vue-next"
import CardContent from "~/components/ui/card/CardContent.vue"
import CardDescription from "~/components/ui/card/CardDescription.vue"
import Checkbox from "~/components/ui/checkbox/Checkbox.vue"
import { showReadableNumber } from "~/lib/utils"

definePageMeta({ middleware: "auth" as never })

const route = useRoute()
const auth = useAuthStore()
const edit = useEditorStore()
const boardId = route.params.id as string
const attach = ref<HTMLInputElement | null>(null)
const sc = ref<{ label: string; value: number }[]>([])

// 추천된 태그를 입력하기
const selectSuggestedTag = (tag: string) => {
  edit.tag = tag
  edit.addTag()
}

// 첨부파일 선택하기
const triggerAttach = () => {
  attach.value?.click()
}

// 해시태그 자동완성
watch(() => edit.tag, edit.searchTags)

// 유사한 글제목 검색
watch(() => edit.title, edit.searchTitles)

await edit.loadBoardConfig(boardId)
edit.categories.forEach((cat) => sc.value.push({ label: cat.name, value: cat.uid }))
</script>
