// @vitest-environment happy-dom
import { ref } from "vue"
import { describe, expect, it } from "vitest"
import { useTiptapEditor } from "../../app/composables/useTiptapEditor.client"
import { useSanitize } from "../../app/composables/useSanitize"

describe("shared editor text alignment", () => {
  it("persists post paragraph and heading alignment through HTML, sanitization, and reopening", () => {
    const initial = '<p>Paragraph</p><h2>Heading</h2><p><img src="https://example.com/photo.jpg"></p><table><tbody><tr><th><p>Cell</p></th><td><p>Data</p></td></tr></tbody></table><pre><code>const value = 1</code></pre>'
    const editor = useTiptapEditor(ref(initial), { profile: "post", onUpdate: () => {} })
    editor.commands.selectAll()
    expect(editor.commands.setTextAlign("right")).toBe(true)

    const saved = editor.getHTML()
    expect(saved).toContain('<p style="text-align: right;">Paragraph</p>')
    expect(saved).toContain('<h2 style="text-align: right;">Heading</h2>')
    expect(saved).toContain('<img src="https://example.com/photo.jpg"')
    expect(saved).toContain("<table ")
    expect(saved).toContain('<pre><code class="language-typescript">const value = 1</code></pre>')
    expect(saved).not.toContain('<pre style="text-align: right;"')

    const displayed = useSanitize().sanitize(saved)
    expect(displayed).toContain('<p style="text-align: right;">Paragraph</p>')
    expect(displayed).toContain('<h2 style="text-align: right;">Heading</h2>')

    const reopened = useTiptapEditor(ref(saved), { profile: "post", onUpdate: () => {} })
    expect(reopened.getHTML()).toContain('<p style="text-align: right;">Paragraph</p>')
    expect(reopened.getHTML()).toContain('<h2 style="text-align: right;">Heading</h2>')
    editor.destroy()
    reopened.destroy()
  })

  it("keeps comment alignment when modified and reloaded", () => {
    const editor = useTiptapEditor(ref("<p>Comment text</p>"), {
      profile: "comment",
      onUpdate: () => {},
    })
    expect(editor.schema.nodes.heading).toBeUndefined()
    for (const alignment of ["left", "center", "right", "justify"] as const) {
      expect(editor.commands.setTextAlign(alignment)).toBe(true)
      expect(editor.isActive({ textAlign: alignment })).toBe(true)
      expect(editor.getHTML()).toContain(`text-align: ${alignment};`)
    }
    const saved = editor.getHTML()
    expect(saved).toContain('<p style="text-align: justify;">Comment text</p>')
    expect(useSanitize().sanitize(saved)).toContain('style="text-align: justify;"')

    const reopened = useTiptapEditor(ref(saved), { profile: "comment", onUpdate: () => {} })
    expect(reopened.isActive({ textAlign: "justify" })).toBe(true)
    expect(reopened.getHTML()).toContain('<p style="text-align: justify;">Comment text</p>')
    editor.destroy()
    reopened.destroy()
  })
})
