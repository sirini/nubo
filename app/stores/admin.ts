import type { AdminMenu } from "~/types/admin"

export const useAdminStore = defineStore("admin", () => {
  const skin = ref<string>("nubo-basic-admin")
  const menu = ref<AdminMenu>("Dashboard")

  // 관리화면에서 메뉴 열기
  const openMenu = (newMenu: AdminMenu) => {
    menu.value = newMenu
  }

  return {
    skin,
    menu,

    openMenu,
  }
})
