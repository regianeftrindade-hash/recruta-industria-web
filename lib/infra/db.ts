import { PrismaClient } from '@prisma/client'
import { env } from 'node:process'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

/**
 * Lê a URL em runtime via `node:process`.
 * Evita que o bundler da Next/Vercel substitua `process.env.DATABASE_URL`
 * pelo valor (ou ausência) do momento do build — causa do HTTP 500 em
 * `/api/vagas` e do 401 de login no deploy Production 428f63d.
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
