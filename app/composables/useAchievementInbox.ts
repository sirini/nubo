import type { Resp } from "~/types/common"
import type { UserBadge } from "~/types/user"

export const useAchievementInbox = () => {
  const config = useRuntimeConfig()
  const refreshSignal = useState<number>("achievement-inbox-refresh", () => 0)

  const loadUnannouncedAchievements = async () => {
    return await $fetch<Resp<UserBadge[]>>("/auth/user/achievements", {
      baseURL: config.public.apiBase,
      method: "GET",
    })
  }

  const acknowledgeAchievements = async (keys: string[]) => {
    return await $fetch<Resp<null>>("/auth/user/achievements", {
      baseURL: config.public.apiBase,
      method: "PATCH",
      body: { keys },
    })
  }

  const notifyAchievementCheck = () => {
    refreshSignal.value += 1
  }

  return { acknowledgeAchievements, loadUnannouncedAchievements, notifyAchievementCheck, refreshSignal }
}
