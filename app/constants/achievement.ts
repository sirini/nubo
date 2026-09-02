export const ACHIEVEMENT_ICON_OPTIONS = [
  { key: "award", label: "훈장" },
  { key: "trophy", label: "트로피" },
  { key: "medal", label: "메달" },
  { key: "crown", label: "왕관" },
  { key: "ribbon", label: "리본" },
  { key: "star", label: "별" },
  { key: "sparkles", label: "반짝임" },
  { key: "camera", label: "카메라" },
  { key: "aperture", label: "조리개" },
  { key: "notebook-pen", label: "글쓰기" },
  { key: "message-circle", label: "댓글" },
] as const

export type AchievementIconKey = (typeof ACHIEVEMENT_ICON_OPTIONS)[number]["key"]
