const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** Fixed KST output, independent of the browser/server locale or timezone. */
export function formatLogTimestamp(value: string): string {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return "—"
  return new Date(timestamp + KST_OFFSET_MS).toISOString().slice(0, 19).replace("T", " ")
}

export function kstDateKey(now = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
}
