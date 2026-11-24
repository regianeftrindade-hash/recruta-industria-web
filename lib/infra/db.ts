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
 * Lê a URL do banco em runtime via `node:process.env` (import de `node:process`).
 *
 * Causa (Production 428f63d / PR #73): o bundler Next/Vercel pode substituir
 * `process.env.DATABASE_URL` pelo valor do *build* (vazio). O Prisma Client
 * então falha no runtime com "Environment variable not found: DATABASE_URL"
 * — /api/vagas 500 e login 401 — mesmo com a env presente no projeto Vercel.
 * Deploy antigo (e9eed47) sem esse freeze ainda lia a env.
 *
 * Mitigação: `datasourceUrl` explícito + `@prisma/client` em
 * `serverExternalPackages` (next.config.js) + query engine no file tracing.
 *
 * Separação Preview/Staging:
 * - Em `VERCEL_ENV=preview`, prefere `STAGING_DATABASE_URL` quando presente.
 * - Em Preview, recusa URL que ainda aponte para o projeto Production
 *   (fail-closed — melhor 500 controlado do que escrever em Production).
 *
 * Pooler Supabase (porta 6543): garante `pgbouncer=true` para evitar
 * `prepared statement already exists` (42P05) no Session/Transaction pooler.
 */
export function resolveDatabaseUrl(): string | undefined {
  const vercelEnv = env.VERCEL_ENV?.trim()

  if (vercelEnv === 'preview') {
    const staging = env.STAGING_DATABASE_URL?.trim()
    if (staging) return ensurePgBouncerParam(staging)
  }

  const url = env.DATABASE_URL?.trim()
  if (!url) return undefined

  if (vercelEnv === 'preview' && url.includes(PRODUCTION_SUPABASE_PROJECT_REF)) {
    console.error(
      '[db] Preview recusou DATABASE_URL do projeto Production. ' +
        'Configure STAGING_DATABASE_URL ou DATABASE_URL do Staging somente no ambiente Preview.',
    )
    return undefined
  }

  return ensurePgBouncerParam(url)
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
