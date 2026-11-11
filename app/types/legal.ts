export type PrivacyOperationalStatus = {
  visitLogRetentionDays?: number
  available: boolean
  providers: string[]
  imageDescriptionEnabled: boolean | null
  securityLogEnabled: boolean | null
  securityLogRetentionDays: number
  securityLogMaskedIP: boolean | null
  auditLogRetentionDays: number
}
