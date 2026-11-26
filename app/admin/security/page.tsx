'use client'
import { formatUiDateTime } from "@/lib/i18n/format-ui";
import { exactUi } from "@/lib/i18n/exact-ui";

import { useState, useEffect } from 'react'

const COLORS = {
  preto: '#F3E6C8',
  cardBg: '#E8D5A3',
  tinta: '#414141',
  dourado: '#D4AF37',
  douradoEscuro: '#8D6B1F',
  branco: '#414141',
  textoSuave: '#414141',
}

const BTN_GOLD: React.CSSProperties = {
  background: '#E8C56A',
  color: '#414141',
  border: '2px solid #8D6B1F',
  borderRadius: 12,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow:
    'inset 0 1px 0 rgba(255, 228, 150, 0.55), inset 0 -2px 0 rgba(74, 50, 12, 0.42), 0 3px 0 #5a4512, 0 4px 10px rgba(0, 0, 0, 0.45)',
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
  const [activeTab, setActiveTab] = useState<'logs' | 'locks' | 'tools'>('logs')
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [toolIp, setToolIp] = useState('')
  const [toolIdentifier, setToolIdentifier] = useState('')
  const [toolMsg, setToolMsg] = useState('')
  const [toolBusy, setToolBusy] = useState(false)

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
        const data = await logsRes.json()
        setLogs(Array.isArray(data) ? data : Array.isArray(data?.logs) ? data.logs : [])
      }

      if (locksRes.ok) {
        const data = await locksRes.json()
        setLocks(Array.isArray(data) ? data : Array.isArray(data?.locks) ? data.locks : [])
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

  const postTool = async (url: string, body: Record<string, string>) => {
    setToolBusy(true)
    setToolMsg('')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setUnauthorized(true)
        return
      }
      if (!res.ok) {
        setToolMsg(data.error || exactUi('Falha na operação.'))
        return
      }
      setToolMsg(data.message || exactUi('Operação concluída.'))
    } catch {
      setToolMsg(exactUi('Falha na operação.'))
    } finally {
      setToolBusy(false)
    }
  }

  if (unauthorized) {
    return (
      <div style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', background: COLORS.preto, color: COLORS.branco }}>
        <h1 style={{ color: COLORS.dourado }}>Acesso negado</h1>
        <p style={{ color: COLORS.textoSuave }}>{exactUi("Você não tem permissão para acessar o painel de segurança.")}</p>
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
            color: activeTab === 'logs' ? COLORS.tinta : COLORS.branco,
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
            color: activeTab === 'locks' ? COLORS.tinta : COLORS.branco,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            borderRadius: '6px 6px 0 0',
          }}
        >
          🚫 Contas Bloqueadas ({locks.filter(l => !l.unlockedAt).length})
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'tools' ? 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)' : 'linear-gradient(180deg, #5a4512 0%, #7a5f1c 45%, #8D6B1F 100%)',
            color: activeTab === 'tools' ? COLORS.tinta : COLORS.branco,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            borderRadius: '6px 6px 0 0',
          }}
        >
          {exactUi('Ferramentas')}
        </button>
      </div>

      {loading ? (
        <p style={{ color: COLORS.textoSuave }}>{exactUi("Carregando...")}</p>
      ) : activeTab === 'tools' ? (
        <div style={{ display: 'grid', gap: 20, maxWidth: 560 }}>
          <h2 style={{ color: COLORS.dourado, margin: 0 }}>{exactUi('Desbloqueio e rate limit')}</h2>
          <p style={{ color: COLORS.textoSuave, margin: 0 }}>
            Usa as APIs administrativas já existentes. Não altera banco.
          </p>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>{exactUi('IP bloqueado')}</span>
            <input
              value={toolIp}
              onChange={(e) => setToolIp(e.target.value)}
              placeholder="0.0.0.0"
              style={{ padding: 10, borderRadius: 8, border: `1px solid ${COLORS.douradoEscuro}` }}
            />
            <button
              type="button"
              disabled={toolBusy || !toolIp.trim()}
              onClick={() => void postTool('/api/admin/unblock-ip-manual', { ip: toolIp.trim() })}
              style={{ ...BTN_GOLD, padding: '10px 16px', width: 'fit-content' }}
            >
              {exactUi('Desbloquear IP')}
            </button>
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>{exactUi('E-mail ou IP (rate limit)')}</span>
            <input
              value={toolIdentifier}
              onChange={(e) => setToolIdentifier(e.target.value)}
              placeholder="email@exemplo.com"
              style={{ padding: 10, borderRadius: 8, border: `1px solid ${COLORS.douradoEscuro}` }}
            />
            <button
              type="button"
              disabled={toolBusy || !toolIdentifier.trim()}
              onClick={() =>
                void postTool('/api/admin/reset-rate-limit', {
                  identifier: toolIdentifier.trim(),
                })
              }
              style={{ ...BTN_GOLD, padding: '10px 16px', width: 'fit-content' }}
            >
              {exactUi('Resetar rate limit')}
            </button>
          </label>
          {toolMsg && <p style={{ color: COLORS.dourado }}>{toolMsg}</p>}
        </div>
      ) : activeTab === 'logs' ? (
        <div>
          <h2 style={{ color: COLORS.dourado, marginBottom: '20px' }}>{exactUi("Logs de Auditoria")}</h2>
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
                border: `2px solid ${COLORS.douradoEscuro}`,
              }}
            >
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)', color: COLORS.tinta }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{exactUi("Data")}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{exactUi("Evento")}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{exactUi("Usuário")}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{exactUi("Ação")}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{exactUi("Detalhes")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: `2px solid ${COLORS.douradoEscuro}`, color: COLORS.textoSuave }}>
                    <td style={{ padding: '12px' }}>
                      {formatUiDateTime(log.timestamp)}
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
          <h2 style={{ color: COLORS.dourado, marginBottom: '20px' }}>{exactUi("Contas Bloqueadas")}</h2>
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
                        {formatUiDateTime(lock.lockedAt)}
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
              <p style={{ color: COLORS.textoSuave }}>{exactUi("Nenhuma conta bloqueada no momento ✅")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
