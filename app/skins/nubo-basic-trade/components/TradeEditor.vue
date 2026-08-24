<template>
  <section class="container mx-auto py-6"><div class="mx-auto" :style="`max-width: ${config.width}px`">
    <Card><CardHeader><CardTitle>{{ title }}</CardTitle><CardDescription>{{ config.name }} : {{ config.info }}</CardDescription></CardHeader>
      <CardContent class="space-y-4">
        <WritePostOptions /><TradeFields /><WriteDragDropUpload /><WriteDragDropUploadedFiles />
        <WriteTitle /><NuboTiptapEditor v-model="content" :config="config" /><WriteHashtag />
      </CardContent>
      <CardFooter class="flex items-center justify-between border-t">
        <div class="flex gap-2"><Button variant="outline" @click="modify ? cancelEditPost() : cancelNewPost()">취소</Button><Button v-if="!modify && isLoadDraft" variant="outline" @click="loadDraft">임시글 불러오기</Button></div>
        <Button @click="submit">{{ modify ? "수정하기" : "등록하기" }}</Button>
      </CardFooter>
    </Card>
  </div><CommonVLoadingDialog v-model="isWriting" message="거래 게시글을 저장하고 있습니다" /></section>
</template>
<script setup lang="ts">
import { toast } from "vue-sonner"
import { useNuboEditorContext } from "~/providers/contexts/editor"
import { useNuboWriteContext } from "~/providers/contexts/write"
import WriteDragDropUpload from "./write/WriteDragDropUpload.vue"
import WriteDragDropUploadedFiles from "./write/WriteDragDropUploadedFiles.vue"
import WriteHashtag from "./write/WriteHashtag.vue"
import WritePostOptions from "./write/WritePostOptions.vue"
import NuboTiptapEditor from "~/components/editor/NuboTiptapEditor.vue"
import WriteTitle from "./write/WriteTitle.vue"
import TradeFields from "./TradeFields.vue"
const props = defineProps<{ title: string; modify: boolean }>()
const trade = useTradeStore()
const { config, content, isLoadDraft, loadDraft } = useNuboEditorContext()
const { cancelEditPost, cancelNewPost, isWriting, modifyExistPost, writeNewPost } = useNuboWriteContext()
const submit = async () => { const error = trade.validate(); if (error) return toast(`⚠️ ${error}`); await (props.modify ? modifyExistPost() : writeNewPost()) }
</script>
