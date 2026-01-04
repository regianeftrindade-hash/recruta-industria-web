'use client'

import { useState, useEffect } from 'react'

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

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Atualizar a cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [logsRes, locksRes] = await Promise.all([
        fetch('/api/admin/security/audit-logs'),
        fetch('/api/admin/security/account-locks')
      ])

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

      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error('Error unlocking account:', err)
    }
  }

  return (
    <div
      style={{
        padding: '30px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
    >
      <h1 style={{ color: '#001f3f', marginBottom: '30px' }}>
        🔐 Painel de Segurança
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: '2px solid #ddd'
        }}
      >
        <button
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'logs' ? '#001f3f' : 'transparent',
            color: activeTab === 'logs' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📊 Logs de Auditoria ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('locks')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'locks' ? '#001f3f' : 'transparent',
            color: activeTab === 'locks' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🚫 Contas Bloqueadas ({locks.filter(l => !l.unlockedAt).length})
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : activeTab === 'logs' ? (
        <div>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>
            Logs de Auditoria
          </h2>
          <div
            style={{
              overflowX: 'auto'
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#f8f9fa'
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#001f3f', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Data</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Evento</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Usuário</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Ação</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #ddd' }}>
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
          <h2 style={{ color: '#333', marginBottom: '20px' }}>
            Contas Bloqueadas
          </h2>
          <div
            style={{
              display: 'grid',
              gap: '15px'
            }}
          >
            {locks
              .filter(l => !l.unlockedAt)
              .map((lock, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffebee',
                    border: '1px solid #ff5252',
                    padding: '15px',
                    borderRadius: '8px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>
                        📧 {lock.email}
                      </p>
                      <p
                        style={{
                          margin: '5px 0 0 0',
                          fontSize: '14px',
                          color: '#666'
                        }}
                      >
                        Razão: {lock.reason}
                      </p>
                      <p
                        style={{
                          margin: '5px 0 0 0',
                          fontSize: '13px',
                          color: '#999'
                        }}
                      >
                        Tentativas falhadas: {lock.attemptCount} | Bloqueado em:{' '}
                        {new Date(lock.lockedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnlockAccount(lock.email)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🔓 Desbloquear
                    </button>
                  </div>
                </div>
              ))}
            {locks.filter(l => !l.unlockedAt).length === 0 && (
              <p style={{ color: '#666' }}>Nenhuma conta bloqueada no momento ✅</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
