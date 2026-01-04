import fs from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const AUDIT_FILE = join(DATA_DIR, 'audit_logs.json')
const ACCOUNT_LOCKS_FILE = join(DATA_DIR, 'account_locks.json')

async function ensureFile(filePath: string) {
  try {
    await fs.promises.access(filePath)
  } catch {
    await fs.promises.mkdir(DATA_DIR, { recursive: true })
    await fs.promises.writeFile(filePath, '[]')
  }
}

export async function logAudit(
  event: string,
  userId: string,
  action: string,
  details: any = {}
) {
  try {
    await ensureFile(AUDIT_FILE)
    const logs = JSON.parse(
      await fs.promises.readFile(AUDIT_FILE, 'utf8')
    ) as any[]
    
    logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      event,
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: process.env.IP_ADDRESS || 'unknown'
    })
    
    await fs.promises.writeFile(AUDIT_FILE, JSON.stringify(logs, null, 2))
  } catch (err) {
    console.error('Error logging audit:', err)
  }
}

export async function lockAccount(email: string, reason: string) {
  try {
    await ensureFile(ACCOUNT_LOCKS_FILE)
    const locks = JSON.parse(
      await fs.promises.readFile(ACCOUNT_LOCKS_FILE, 'utf8')
    ) as any[]
    
    const existingLock = locks.find(l => l.email === email && !l.unlockedAt)
    if (existingLock) {
      existingLock.attemptCount += 1
      existingLock.lastAttempt = new Date().toISOString()
      existingLock.reason = reason
    } else {
      locks.push({
        id: `lock-${Date.now()}`,
        email,
        reason,
        attemptCount: 1,
        lockedAt: new Date().toISOString(),
        unlockedAt: null,
        unlockedBy: null
      })
    }
    
    await fs.promises.writeFile(ACCOUNT_LOCKS_FILE, JSON.stringify(locks, null, 2))
  } catch (err) {
    console.error('Error locking account:', err)
  }
}

export async function isAccountLocked(email: string): Promise<boolean> {
  try {
    await ensureFile(ACCOUNT_LOCKS_FILE)
    const locks = JSON.parse(
      await fs.promises.readFile(ACCOUNT_LOCKS_FILE, 'utf8')
    ) as any[]
    
    const lock = locks.find(l => l.email === email && !l.unlockedAt)
    
    if (!lock) return false
    
    // Se a conta foi bloqueada há mais de 30 minutos, desbloqueia automaticamente
    const lockedTime = new Date(lock.lockedAt).getTime()
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000
    
    if (now - lockedTime > thirtyMinutes) {
      lock.unlockedAt = new Date().toISOString()
      lock.unlockedBy = 'auto-unlock'
      await fs.promises.writeFile(ACCOUNT_LOCKS_FILE, JSON.stringify(locks, null, 2))
      return false
    }
    
    return lock.attemptCount >= 5
  } catch (err) {
    console.error('Error checking account lock:', err)
    return false
  }
}

export async function unlockAccount(email: string, unlockedBy: string) {
  try {
    await ensureFile(ACCOUNT_LOCKS_FILE)
    const locks = JSON.parse(
      await fs.promises.readFile(ACCOUNT_LOCKS_FILE, 'utf8')
    ) as any[]
    
    const lock = locks.find(l => l.email === email && !l.unlockedAt)
    if (lock) {
      lock.unlockedAt = new Date().toISOString()
      lock.unlockedBy = unlockedBy
      await fs.promises.writeFile(ACCOUNT_LOCKS_FILE, JSON.stringify(locks, null, 2))
    }
  } catch (err) {
    console.error('Error unlocking account:', err)
  }
}

export async function getAuditLogs(
  userId?: string,
  event?: string,
  limit: number = 100
) {
  try {
    await ensureFile(AUDIT_FILE)
    let logs = JSON.parse(
      await fs.promises.readFile(AUDIT_FILE, 'utf8')
    ) as any[]
    
    if (userId) {
      logs = logs.filter(l => l.userId === userId)
    }
    
    if (event) {
      logs = logs.filter(l => l.event === event)
    }
    
    return logs.slice(-limit).reverse()
  } catch (err) {
    console.error('Error getting audit logs:', err)
    return []
  }
}
