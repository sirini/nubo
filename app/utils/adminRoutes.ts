import type { AdminMenu } from "~/types/admin"

export const adminMenuPaths: Record<AdminMenu, string> = {
  Dashboard: "/admin",
  Board: "/admin/boards",
  User: "/admin/members",
  Badge: "/admin/badges",
  Report: "/admin/reports",
  Mail: "/admin/mail",
  Skin: "/admin/skins",
  Logs: "/admin/logs",
  System: "/admin/system",
}

export function adminMenuForPath(path: string): AdminMenu | null {
  if (path.startsWith("/admin/board/")) return "Board"
  return (Object.entries(adminMenuPaths).find(([, value]) => value === path)?.[0] as AdminMenu | undefined) ?? null
}
