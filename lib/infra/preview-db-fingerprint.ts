import { createHash } from 'node:crypto'
import { env } from 'node:process'

/** Fingerprint validado no agente (Staging funcional). Sem segredos. */
export const VALIDATED_STAGING_FINGERPRINT = {
  user: 'postgres.gshhznyretzrdnmkgmgj',
  databasePort: '6543',
  directPort: '5432',
  passSha256_8: '89fe9f42',
} as const

export type UrlFingerprint = {
  present: boolean
  host: string | null
  port: string | null
  user: string | null
  passLen: number | null
  passSha256_8: string | null
  parseError: boolean
}

export type PreviewDbFingerprintReport = {
  VERCEL_ENV: string | null
  STAGING_DATABASE_URL: UrlFingerprint
  STAGING_DIRECT_URL: UrlFingerprint
  resolvedDatabaseUrl: UrlFingerprint
  validated: typeof VALIDATED_STAGING_FINGERPRINT
  divergence: {
    databaseUser: boolean
    databasePort: boolean
    databasePassHash: boolean
    directUser: boolean
    directPort: boolean
    directPassHash: boolean
    stagingDatabaseMissing: boolean
    stagingDirectMissing: boolean
  }
}

export function fingerprintConnectionUrl(raw: string | undefined | null): UrlFingerprint {
  const empty: UrlFingerprint = {
    present: false,
    host: null,
    port: null,
    user: null,
    passLen: null,
    passSha256_8: null,
    parseError: false,
  }
  if (raw == null || !String(raw).trim()) return empty
  try {
    const u = new URL(String(raw).trim())
    const user = decodeURIComponent(u.username || '')
    const pass = u.password != null ? decodeURIComponent(u.password) : ''
    return {
      present: true,
      host: u.hostname || null,
      port: u.port || null,
      user: user || null,
      passLen: pass.length,
      passSha256_8: createHash('sha256').update(pass).digest('hex').slice(0, 8),
      parseError: false,
    }
  } catch {
    return { ...empty, present: true, parseError: true }
  }
}

/**
 * Monta o relatório. Não inclui senha nem URL completa.
 * Não escreve segredos em logs.
 */
export function buildPreviewDbFingerprintReport(input?: {
  VERCEL_ENV?: string | null
  STAGING_DATABASE_URL?: string | null
  STAGING_DIRECT_URL?: string | null
  resolvedDatabaseUrl?: string | null
}): PreviewDbFingerprintReport {
  const vercelEnv = (input?.VERCEL_ENV ?? env.VERCEL_ENV ?? null)?.trim() || null
  const stagingDb = input?.STAGING_DATABASE_URL ?? env.STAGING_DATABASE_URL ?? null
  const stagingDirect = input?.STAGING_DIRECT_URL ?? env.STAGING_DIRECT_URL ?? null
  const resolved = input?.resolvedDatabaseUrl ?? null

  const dbFp = fingerprintConnectionUrl(stagingDb)
  const directFp = fingerprintConnectionUrl(stagingDirect)
  const resolvedFp = fingerprintConnectionUrl(resolved)

  return {
    VERCEL_ENV: vercelEnv,
    STAGING_DATABASE_URL: dbFp,
    STAGING_DIRECT_URL: directFp,
    resolvedDatabaseUrl: resolvedFp,
    validated: VALIDATED_STAGING_FINGERPRINT,
    divergence: {
      stagingDatabaseMissing: !dbFp.present || dbFp.parseError,
      stagingDirectMissing: !directFp.present || directFp.parseError,
      databaseUser: dbFp.user !== VALIDATED_STAGING_FINGERPRINT.user,
      databasePort: dbFp.port !== VALIDATED_STAGING_FINGERPRINT.databasePort,
      databasePassHash: dbFp.passSha256_8 !== VALIDATED_STAGING_FINGERPRINT.passSha256_8,
      directUser: directFp.user !== VALIDATED_STAGING_FINGERPRINT.user,
      directPort: directFp.port !== VALIDATED_STAGING_FINGERPRINT.directPort,
      directPassHash: directFp.passSha256_8 !== VALIDATED_STAGING_FINGERPRINT.passSha256_8,
    },
  }
}

/** Só Preview. Production / development / unset → bloqueado. */
export function isPreviewDbFingerprintAllowed(vercelEnv: string | null | undefined): boolean {
  return (vercelEnv ?? '').trim() === 'preview'
}
