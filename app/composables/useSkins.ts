import type { AdminSkinInfo, AdminSkinType } from "~/types/admin"
import type { Resp } from "~/types/common"
import type { Component } from "vue"

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
  const settings = useState<Record<AdminSkinType, string>>("skin-settings", () => ({ ...defaults }))
  const loaded = useState("skin-settings-loaded", () => false)

  const loadSettings = async () => {
    if (loaded.value) return
    try {
      const config = useRuntimeConfig()
      const response = await $fetch<Resp<Partial<Record<AdminSkinType, string>>>>("/skin/settings", {
        baseURL: config.public.apiBase,
      })
      if (response.success) settings.value = { ...settings.value, ...response.result }
    } catch (error) {
      // Older GOAPI binaries do not expose the skin settings endpoint yet.
      // Keep the built-in defaults so a backend upgrade never blocks the whole site.
      console.warn("Skin settings could not be loaded; using built-in defaults.", error)
    } finally {
      loaded.value = true
    }
  }

  const installed = computed<AdminSkinInfo[]>(() => Object.entries(manifests).flatMap(([path, value]) => {
    const manifest = value as Omit<AdminSkinInfo, "type">
    const key = path.split("/").slice(-2)[0] || manifest.key
    return (Object.keys(entryByType) as AdminSkinType[])
      .filter((type) => entryByType[type].some((entry) => Object.keys(components).some((componentPath) => componentPath.includes(`/${key}/${entry}`))))
      .map((type) => ({ ...manifest, key, type }))
  }))

  return { defaults, installed, loadSettings, settings }
}
