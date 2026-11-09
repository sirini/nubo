export type PrivacyOperationalStatus = {
  available: boolean
  providers: string[]
  imageDescriptionEnabled: boolean | null
  securityLogEnabled: boolean | null
  securityLogRetentionDays: number
  securityLogMaskedIP: boolean | null
  auditLogRetentionDays: number
}
