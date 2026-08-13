import type { AdminSkinInfo, AdminSkinType } from "~/types/admin"
import type { Resp } from "~/types/common"
import type { Component } from "vue"
import { z } from "zod"

const defaults: Record<AdminSkinType, string> = {
  layout: "nubo-basic-layout",
  home: "nubo-basic-home",
  admin: "nubo-basic-admin",
  login: "nubo-basic-login",
  profile: "nubo-basic-profile",
  privacy: "nubo-basic-privacy",
  error: "nubo-basic-error",
  board: "nubo-basic-board",
}

const manifests = import.meta.glob("~/skins/*/skin.json", { eager: true, import: "default" })
const components = import.meta.glob("~/skins/*/*.vue")
const manifestSchema = z.object({
  key: z.string().regex(/^[a-z0-9_-]{3,80}$/),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  author: z.string().min(1),
  website: z.string().url(),
  description: z.string().min(1),
  preview: z.string().min(1),
  features: z.array(z.string()),
  min_nubo_version: z.string().regex(/^\d+\.\d+\.\d+$/),
})

export const resolveSkinComponent = (skinKey: string, entry: string, fallbackEntry = entry) => {
  const find = (key: string, filename: string) => Object.entries(components).find(([path]) => path.endsWith(`/skins/${key}/${filename}.vue`))?.[1]
  const loader = find(skinKey, entry) || find(skinKey, fallbackEntry) || find("nubo-basic-board", entry) || find("nubo-basic-board", fallbackEntry)
  return loader ? defineAsyncComponent(loader as () => Promise<{ default: Component }>) : null
}

const entryByType: Record<AdminSkinType, string[]> = {
  layout: ["Layout.vue"], home: ["Home.vue"], admin: ["Admin.vue"],
  login: ["Login.vue"], profile: ["Profile.vue"], privacy: ["Privacy.vue"],
  error: ["Error.vue"], board: ["DefaultList.vue", "BoardList.vue", "GalleryList.vue", "BlogList.vue"],
}

export const useSkins = () => {
  const config = useRuntimeConfig()
  const settings = useState<Record<AdminSkinType, string>>("skin-settings", () => ({ ...defaults }))
  const loaded = useState("skin-settings-loaded", () => false)

  const versionAtLeast = (current: string, minimum: string) => {
    const left = current.replace(/^v/, "").split(".").map(Number)
    const right = minimum.replace(/^v/, "").split(".").map(Number)
    for (let i = 0; i < 3; i++) {
      if ((left[i] || 0) !== (right[i] || 0)) return (left[i] || 0) > (right[i] || 0)
    }
    return true
  }

  const registry = computed(() => Object.entries(manifests).map(([path, value]) => {
    const directoryKey = path.split("/").slice(-2)[0] || ""
    const parsed = manifestSchema.safeParse(value)
    if (!parsed.success) return { path, issues: [`manifest 형식 오류: ${parsed.error.issues[0]?.message || "알 수 없는 오류"}`], skins: [] as AdminSkinInfo[] }
    const manifest = parsed.data
    const issues: string[] = []
    if (manifest.key !== directoryKey) issues.push(`key(${manifest.key})와 폴더명(${directoryKey})이 다릅니다`)
    if (!versionAtLeast(String(config.public.version), manifest.min_nubo_version)) issues.push(`NUBO ${manifest.min_nubo_version} 이상이 필요합니다`)
    const skins = (Object.keys(entryByType) as AdminSkinType[])
      .filter((type) => entryByType[type].some((entry) => Object.keys(components).some((componentPath) => componentPath.endsWith(`/skins/${directoryKey}/${entry}`))))
      .map((type) => ({ ...manifest, key: directoryKey, type }))
    if (!skins.length) issues.push("지원되는 Vue 엔트리 파일이 없습니다")
    return { path, issues, skins: issues.length ? [] : skins }
  }))

  const installed = computed<AdminSkinInfo[]>(() => registry.value.flatMap((item) => item.skins))
  const manifestIssues = computed(() => registry.value.flatMap((item) => item.issues.map((issue) => `${item.path}: ${issue}`)))

  const loadSettings = async () => {
    if (loaded.value) return
    try {
      const response = await $fetch<Resp<Partial<Record<AdminSkinType, string>>>>("/skin/settings", {
        baseURL: config.public.apiBase,
      })
      if (response.success) {
        for (const type of Object.keys(defaults) as AdminSkinType[]) {
          const requested = response.result?.[type]
          settings.value[type] = requested && installed.value.some((skin) => skin.type === type && skin.key === requested) ? requested : defaults[type]
        }
      }
    } catch (error) {
      // Older GOAPI binaries do not expose the skin settings endpoint yet.
      // Keep the built-in defaults so a backend upgrade never blocks the whole site.
      console.warn("Skin settings could not be loaded; using built-in defaults.", error)
    } finally {
      loaded.value = true
    }
  }

  return { defaults, installed, loadSettings, manifestIssues, settings }
}
