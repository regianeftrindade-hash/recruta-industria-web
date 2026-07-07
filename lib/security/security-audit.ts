// Auditoria de segurança - Sem persistência em arquivo
// Em produção, isso deveria ir para um serviço de logging (Datadog, CloudWatch, etc)

const ACCOUNT_LOCKS = new Map<string, { expiresAt: Date; reason: string }>()

export async function logAudit(
  event: string,
  userId: string,
  action: string,
  details: any = {}
) {
  try {
    // Log em console para desenvolvimento
    console.log('[AUDIT]', {
      event,
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    })
    // Em produção, enviar para serviço de logging externo (Datadog, CloudWatch, etc)
  } catch (err) {
    console.error('Error logging audit:', err)
  }
}

export async function lockAccount(email: string, reason: string) {
  try {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
    ACCOUNT_LOCKS.set(email, { expiresAt, reason })
    console.log('[SECURITY] Account locked:', { email, reason })
  } catch (err) {
    console.error('Error locking account:', err)
  }
}

export async function isAccountLocked(email: string): Promise<boolean> {
  try {
    const lock = ACCOUNT_LOCKS.get(email)
    
    if (!lock) return false
    
    // Se expirou, desbloqueia automaticamente
    if (lock.expiresAt < new Date()) {
      ACCOUNT_LOCKS.delete(email)
      return false
    }
    
    return true
  } catch (err) {
    console.error('Error checking account lock:', err)
    return false
  }
}

export async function unlockAccount(email: string, unlockedBy: string) {
  try {
    ACCOUNT_LOCKS.delete(email)
    console.log('[SECURITY] Account unlocked:', { email, unlockedBy })
  } catch (err) {
    console.error('Error unlocking account:', err)
  }
}

export async function getAuditLogs(
  userId?: string,
  event?: string,
  limit: number = 100
) {
  // Retorna array vazio - implementar com banco de dados em produção
  return []
}
