import { Editor } from "@tiptap/vue-3"
import { defineStore } from "pinia"
import { ref } from "vue"
import type { HeadingLevel } from "~/types/editor"

export const useEditorStore = defineStore("editor", () => {
  const isUploadingImages = ref<boolean>(false)
  const editor = ref<Editor | null>(null)

  // 글자 색상 변경하기
  function selectColor(event: Event): void {
    const target = event.target as HTMLInputElement
    if (target && editor.value) {
      editor.value.chain().focus().setColor(target.value).run()
    }
  }

  // 링크 설정하기
  function setLink(): void {
    if (!editor.value) return
    const previousUrl = editor.value.getAttributes("link").href
    const url = window.prompt("URL을 입력하세요.", previousUrl)

    if (url === null) return // Cancelled
    if (url === "") {
      // Unset link
      editor.value.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.value.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  // 헤딩 선택하기
  function toggleHeading(event: Event): void {
    const target = event.target as HTMLSelectElement
    if (!target || !editor.value) return
    const level = parseInt(target.value, 10) as HeadingLevel
    editor.value.chain().focus().toggleHeading({ level }).run()
  }

  // 헤딩이 선택되었는지 확인하기
  function isHeadingActive(): boolean {
    if (!editor.value) return false

    return (
      editor.value.isActive("heading", { level: 1 }) ||
      editor.value.isActive("heading", { level: 2 }) ||
      editor.value.isActive("heading", { level: 3 }) ||
      editor.value.isActive("heading", { level: 4 })
    )
  }

  return {
    isUploadingImages,
    editor,

    selectColor,
    setLink,
    toggleHeading,
    isHeadingActive,
  }
})
