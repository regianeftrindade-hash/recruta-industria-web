import { PrismaClient } from '@prisma/client'
import { env } from 'node:process'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

/**
 * Ref do projeto Supabase de Production (us-east-2).
 * Preview nunca deve conectar neste projeto.
 */
export const PRODUCTION_SUPABASE_PROJECT_REF = 'yxwgjlzzxkitvcduckgk'

/**
 * Ref do projeto Supabase de Staging (sa-east-1).
 */
export const STAGING_SUPABASE_PROJECT_REF = 'gshhznyretzrdnmkgmgj'

/**
 * Sentinel local inválido. Usado quando o Preview ainda aponta para Production:
 * precisa ser uma URL explícita — se devolvermos `undefined`, o Prisma cai no
 * `env("DATABASE_URL")` do schema e continua batendo em Production.
 */
export const PREVIEW_PRODUCTION_BLOCK_URL =
  'postgresql://preview_refused_production:preview_refused_production@127.0.0.1:1/preview_refused_production'

export function looksLikeProductionDatabaseUrl(url: string): boolean {
  return url.includes(PRODUCTION_SUPABASE_PROJECT_REF) || url.includes('us-east-2')
}

/**
 * Lê a URL do banco em runtime via `node:process.env` (import de `node:process`).
 *
 * Preview: prioriza `STAGING_DATABASE_URL` — não exige editar `DATABASE_URL` na Vercel.
 * Production: usa `DATABASE_URL` normalmente.
 * Preview nunca faz fallback para o projeto Production.
 *
 * Pooler Supabase (porta 6543): garante `pgbouncer=true` para evitar 42P05.
 */
export function resolveDatabaseUrl(): string | undefined {
  const vercelEnv = env.VERCEL_ENV?.trim()

  if (vercelEnv === 'preview') {
    const staging = env.STAGING_DATABASE_URL?.trim()
    if (staging) {
      if (looksLikeProductionDatabaseUrl(staging)) {
        console.error('[db] STAGING_DATABASE_URL no Preview aponta para Production — bloqueado.')
        return PREVIEW_PRODUCTION_BLOCK_URL
      }
      return ensurePgBouncerParam(staging)
    }
  }

  const url = env.DATABASE_URL?.trim()
  if (!url) return undefined

  if (vercelEnv === 'preview' && looksLikeProductionDatabaseUrl(url)) {
    console.error(
      '[db] Preview recusou DATABASE_URL do projeto Production. ' +
        'Cadastre STAGING_DATABASE_URL (e STAGING_DIRECT_URL) só no ambiente Preview.',
    )
    return PREVIEW_PRODUCTION_BLOCK_URL
  }

  return ensurePgBouncerParam(url)
}

/**
 * Preview: prioriza `STAGING_DIRECT_URL` (porta 5432, sem pgbouncer).
 * Production: usa `DIRECT_URL` normalmente.
 * Preview nunca faz fallback para Production.
 */
export function resolveDirectUrl(): string | undefined {
  const vercelEnv = env.VERCEL_ENV?.trim()

  if (vercelEnv === 'preview') {
    const staging = env.STAGING_DIRECT_URL?.trim()
    if (staging) {
      if (looksLikeProductionDatabaseUrl(staging)) {
        console.error('[db] STAGING_DIRECT_URL no Preview aponta para Production — bloqueado.')
        return PREVIEW_PRODUCTION_BLOCK_URL
      }
      return staging
    }
  }

  const url = env.DIRECT_URL?.trim()
  if (!url) return undefined

  if (vercelEnv === 'preview' && looksLikeProductionDatabaseUrl(url)) {
    console.error(
      '[db] Preview recusou DIRECT_URL do projeto Production. ' +
        'Cadastre STAGING_DIRECT_URL só no ambiente Preview.',
    )
    return PREVIEW_PRODUCTION_BLOCK_URL
  }

  return url
}

/**
 * No Preview, alinha `process.env.DATABASE_URL` / `DIRECT_URL` às STAGING_*
 * (ou sentinel) para o schema Prisma (`env("DIRECT_URL")`) sem exigir editar
 * as variáveis Production/compartilhadas na Vercel.
 * Em Production este no-op.
 */
export function applyPreviewStagingOverrides(): void {
  if (env.VERCEL_ENV?.trim() !== 'preview') return

  const db = resolveDatabaseUrl()
  if (db) env.DATABASE_URL = db

  const direct = resolveDirectUrl()
  if (direct) env.DIRECT_URL = direct
}

/** Pooler :6543 precisa desligar prepared statements do Prisma. */
export function ensurePgBouncerParam(url: string): string {
  try {
    const parsed = new URL(url)
    const port = parsed.port || (parsed.protocol === 'postgresql:' ? '5432' : '')
    const isPoolerPort = port === '6543'
    const hostLooksPooler = parsed.hostname.includes('pooler.supabase.com')
    if (!isPoolerPort && !hostLooksPooler) return url
    if (port && port !== '6543') return url
    if (parsed.searchParams.get('pgbouncer') === 'true') return url
    parsed.searchParams.set('pgbouncer', 'true')
    return parsed.toString()
  } catch {
    return url
  }
}

function createPrismaClient(): PrismaClient {
  applyPreviewStagingOverrides()
  const datasourceUrl = resolveDatabaseUrl()
  // datasourceUrl sobrescreve o `url` do schema; não embute a senha em logs.
  return new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
