export function useVisit() {
  const { $api } = useNuxtApp()
  const flagKey = "nuboIsVisitToday"
  const today = new Date().toISOString().slice(0, 10)

  // 오늘 첫 방문자이면 방문 기록 추가하기
  const call = async (userUid?: number) => {
    if (import.meta.server) return // 서버에서는 실행 금지
    try {
      if (localStorage.getItem(flagKey) === today) return

      await $api("/home/visit", {
        method: "GET",
        params: { userUid },
      })
    } catch (e) {
      console.error("Update visit failed:", e)
    } finally {
      localStorage.setItem(flagKey, today)
    }
  }

  return { call }
}
