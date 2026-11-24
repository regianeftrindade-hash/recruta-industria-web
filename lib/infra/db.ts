import { PrismaClient } from '@prisma/client'
import { env } from 'node:process'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

/**
 * Lê DATABASE_URL em runtime via `node:process.env` (import de `node:process`).
 *
 * Causa (Production 428f63d / PR #73): o bundler Next/Vercel pode substituir
 * `process.env.DATABASE_URL` pelo valor do *build* (vazio). O Prisma Client
 * então falha no runtime com "Environment variable not found: DATABASE_URL"
 * — /api/vagas 500 e login 401 — mesmo com a env presente no projeto Vercel.
 * Deploy antigo (e9eed47) sem esse freeze ainda lia a env.
 *
 * Mitigação: `datasourceUrl` explícito + `@prisma/client` em
 * `serverExternalPackages` (next.config.js) + query engine no file tracing.
 */
export function resolveDatabaseUrl(): string | undefined {
  const url = env.DATABASE_URL?.trim()
  return url || undefined
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
