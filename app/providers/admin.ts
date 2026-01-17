import type { AdminMenu } from "~/types/admin"
import type { NuboAdminContext } from "~/types/nubo-skin-keys"

export const useAdminProvider = (): NuboAdminContext => {
  const admin = useAdminStore()
  const adminViews: Record<AdminMenu, any> = {
    Dashboard: defineAsyncComponent(
      () => import(`~/skins/admin/${admin.skin}/components/Dashboard.vue`),
    ),
    Board: defineAsyncComponent(() => import(`~/skins/admin/${admin.skin}/components/Board.vue`)),
    User: defineAsyncComponent(() => import(`~/skins/admin/${admin.skin}/components/User.vue`)),
    Report: defineAsyncComponent(() => import(`~/skins/admin/${admin.skin}/components/Report.vue`)),
    System: defineAsyncComponent(() => import(`~/skins/admin/${admin.skin}/components/System.vue`)),
  }

  return {
    panel: computed(() => adminViews[admin.menu] || adminViews.Dashboard),
    menu: computed(() => admin.menu),
    openMenu: (newMenu: AdminMenu) => admin.openMenu(newMenu),
  }
}
