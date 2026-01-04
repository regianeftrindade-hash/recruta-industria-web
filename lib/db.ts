// Prisma Client singleton
import { PrismaClient } from '@prisma/client'
import { join } from 'path'
import fs from 'fs'

// Singleton Prisma instance
const globalForPrisma = global as unknown as { prisma: PrismaClient }

let prismaInstance: PrismaClient | undefined

if (!prismaInstance) {
  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma || prismaInstance

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Legacy SQLite helper for backward compatibility
type DB = {
  isAvailable: boolean
  prepare?: (sql: string) => any
  exec?: (sql: string) => any
}

let db: DB = { isAvailable: false }
let _triedInit = false
// Promise that resolves when DB initialization completes (attempted lazily)
let _dbReadyResolve: (v: any) => void = () => {}
export const dbReady: Promise<boolean> = new Promise((res) => {
  _dbReadyResolve = res as any
})

function tryInit() {
  if (_triedInit) return
  _triedInit = true
  try {
    // build package name at runtime to avoid static analysis
    const pkgName = ['better', 'sqlite3'].join('-')
    // create a dynamic require that bundlers can't statically analyze
    // eslint-disable-next-line no-new-func
    const dynamicRequire = (globalThis as any).require || new Function('pkg', 'return require(pkg)')
    const Database = dynamicRequire(pkgName)
    const dbPath = join(process.cwd(), 'data', 'payments.sqlite')
    const instance = new Database(dbPath)

    db = {
      isAvailable: true,
      prepare: (sql: string) => instance.prepare(sql),
      exec: (sql: string) => instance.exec(sql),
    }

    db.exec?.(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        externalId TEXT,
        amount INTEGER,
        currency TEXT,
        method TEXT,
        customer TEXT,
        status TEXT,
        meta TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `)
    _dbReadyResolve(true)
  } catch (err) {
    db = { isAvailable: false }
    _dbReadyResolve(false)
  }
}

export function isDbAvailable() {
  tryInit()
  return db.isAvailable
}

export function dbPrepare(sql: string) {
  tryInit()
  if (!db.isAvailable) throw new Error('DB unavailable')
  return db.prepare!(sql)
}

export default db
