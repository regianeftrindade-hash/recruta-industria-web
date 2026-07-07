'use client'

import { useState, useEffect } from 'react'

const COLORS = {
  preto: '#000000',
  cardBg: '#111111',
  dourado: '#C89B3C',
  douradoEscuro: '#8D6B1F',
  branco: '#F2F2F2',
  textoSuave: '#F2F2F2',
}

const BTN_GOLD: React.CSSProperties = {
  background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
  color: COLORS.preto,
}

interface AuditLog {
  id: string
  event: string
  userId: string
  action: string
  timestamp: string
  details: any
}

interface AccountLock {
  email: string
  reason: string
  attemptCount: number
  lockedAt: string
  unlockedAt?: string
}

export default function SecurityDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [locks, setLocks] = useState<AccountLock[]>([])
  const [activeTab, setActiveTab] = useState<'logs' | 'locks'>('logs')
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [logsRes, locksRes] = await Promise.all([
        fetch('/api/admin/security/audit-logs'),
        fetch('/api/admin/security/account-locks')
      ])

      if (logsRes.status === 401 || locksRes.status === 401) {
        setUnauthorized(true)
        return
      }

      if (logsRes.ok) {
        setLogs(await logsRes.json())
      }

      if (locksRes.ok) {
        setLocks(await locksRes.json())
      }
    } catch (err) {
      console.error('Error fetching security data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockAccount = async (email: string) => {
    try {
      const res = await fetch('/api/admin/security/unlock-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, unlockedBy: 'admin' })
      })

      if (res.status === 401) {
        setUnauthorized(true)
        return
      }

      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error('Error unlocking account:', err)
    }
  }

  if (unauthorized) {
    return (
      <div style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', background: COLORS.preto, color: COLORS.branco }}>
        <h1 style={{ color: COLORS.dourado }}>Acesso negado</h1>
        <p style={{ color: COLORS.textoSuave }}>
          Você não tem permissão para acessar o painel de segurança.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '30px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        background: COLORS.preto,
        color: COLORS.branco,
      }}
    >
      <h1 style={{ color: COLORS.dourado, marginBottom: '30px' }}>
        🔐 Painel de Segurança
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: `2px solid ${COLORS.douradoEscuro}`,
        }}
      >
        <button
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'logs' ? 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)' : 'linear-gradient(180deg, #5a4512 0%, #7a5f1c 45%, #8D6B1F 100%)',
            color: activeTab === 'logs' ? COLORS.preto : COLORS.branco,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            borderRadius: '6px 6px 0 0',
          }}
        >
          📊 Logs de Auditoria ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('locks')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'locks' ? 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)' : 'linear-gradient(180deg, #5a4512 0%, #7a5f1c 45%, #8D6B1F 100%)',
            color: activeTab === 'locks' ? COLORS.preto : COLORS.branco,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            borderRadius: '6px 6px 0 0',
          }}
        >
          🚫 Contas Bloqueadas ({locks.filter(l => !l.unlockedAt).length})
        </button>
      </div>

      {loading ? (
        <p style={{ color: COLORS.textoSuave }}>Carregando...</p>
      ) : activeTab === 'logs' ? (
        <div>
          <h2 style={{ color: COLORS.dourado, marginBottom: '20px' }}>
            Logs de Auditoria
          </h2>
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: COLORS.cardBg,
                border: `1px solid ${COLORS.douradoEscuro}`,
              }}
            >
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)', color: COLORS.preto }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Data</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Evento</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Usuário</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Ação</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${COLORS.douradoEscuro}`, color: COLORS.textoSuave }}>
                    <td style={{ padding: '12px' }}>
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '12px' }}>{log.event}</td>
                    <td style={{ padding: '12px' }}>{log.userId}</td>
                    <td style={{ padding: '12px' }}>{log.action}</td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>
                      {JSON.stringify(log.details).substring(0, 50)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{ color: COLORS.dourado, marginBottom: '20px' }}>
            Contas Bloqueadas
          </h2>
          <div
            style={{
              display: 'grid',
              gap: '15px',
            }}
          >
            {locks
              .filter(l => !l.unlockedAt)
              .map((lock, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: COLORS.cardBg,
                    border: `1px solid ${COLORS.dourado}`,
                    padding: '15px',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold', color: COLORS.branco }}>
                        📧 {lock.email}
                      </p>
                      <p
                        style={{
                          margin: '5px 0 0 0',
                          fontSize: '14px',
                          color: COLORS.textoSuave,
                        }}
                      >
                        Razão: {lock.reason}
                      </p>
                      <p
                        style={{
                          margin: '5px 0 0 0',
                          fontSize: '13px',
                          color: COLORS.textoSuave,
                          opacity: 0.8,
                        }}
                      >
                        Tentativas falhadas: {lock.attemptCount} | Bloqueado em:{' '}
                        {new Date(lock.lockedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnlockAccount(lock.email)}
                      style={{
                        ...BTN_GOLD,
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      🔓 Desbloquear
                    </button>
                  </div>
                </div>
              ))}
            {locks.filter(l => !l.unlockedAt).length === 0 && (
              <p style={{ color: COLORS.textoSuave }}>Nenhuma conta bloqueada no momento ✅</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
