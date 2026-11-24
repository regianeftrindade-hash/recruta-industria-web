import { PrismaClient } from '@prisma/client'
import { env } from 'node:process'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

/**
 * Lê DATABASE_URL em runtime via `node:process`.
 * Em builds recentes da Vercel Production o bundler chegou a “congelar”
 * a ausência da env no Prisma Client — /api/vagas 500 e login 401 com
 * “Environment variable not found: DATABASE_URL”, enquanto um deploy
 * antigo do mesmo código ainda lia a env normalmente.
 */
export function resolveDatabaseUrl(): string | undefined {
  const url = env.DATABASE_URL?.trim()
  return url || undefined
}

function createPrismaClient(): PrismaClient {
  const datasourceUrl = resolveDatabaseUrl()
  return new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
