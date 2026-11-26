import { NextResponse } from 'next/server'
import { env } from 'node:process'
import {
  buildPreviewDbFingerprintReport,
  isPreviewDbFingerprintAllowed,
} from '@/lib/infra/preview-db-fingerprint'
import { resolveDatabaseUrl } from '@/lib/infra/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * TEMPORÁRIO — diagnóstico Preview only.
 * Não retorna senha/URL. Remover após o diagnóstico.
 */
export async function GET() {
  const vercelEnv = env.VERCEL_ENV?.trim() ?? null

  if (!isPreviewDbFingerprintAllowed(vercelEnv)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Resolve sem logar a URL.
  let resolved: string | null = null
  try {
    resolved = resolveDatabaseUrl() ?? null
  } catch {
    resolved = null
  }

  const report = buildPreviewDbFingerprintReport({
    VERCEL_ENV: vercelEnv,
    STAGING_DATABASE_URL: env.STAGING_DATABASE_URL ?? null,
    STAGING_DIRECT_URL: env.STAGING_DIRECT_URL ?? null,
    resolvedDatabaseUrl: resolved,
  })

  return NextResponse.json(report)
}
