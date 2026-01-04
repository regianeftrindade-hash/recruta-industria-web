'use client'

import { useState } from 'react'

interface EmailVerificationProps {
  email: string
  onVerified: (token: string) => void
}

export default function EmailVerification({
  email,
  onVerified
}: EmailVerificationProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Código inválido')
        return
      }

      onVerified(data.token)
    } catch (err) {
      setError('Erro ao verificar email')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown(c => {
          if (c <= 1) clearInterval(interval)
          return c - 1
        })
      }, 1000)
    } catch (err) {
      setError('Erro ao reenviar código')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '30px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px'
      }}
    >
      <h2 style={{ color: '#001f3f', marginBottom: '20px' }}>
        ✉️ Verificar Email
      </h2>

      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        Enviamos um código de verificação para <strong>{email}</strong>
      </p>

      {error && (
        <div
          style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: 'bold'
            }}
          >
            Código de Verificação
          </label>
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value.slice(0, 6))}
            maxLength={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              textAlign: 'center',
              letterSpacing: '4px'
            }}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: code.length === 6 && !loading ? '#001f3f' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: code.length === 6 && !loading ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          {loading ? '⏳ Verificando...' : '✓ Verificar'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>
          Não recebeu o código?
        </p>
        <button
          onClick={handleResend}
          disabled={loading || resendCooldown > 0}
          style={{
            backgroundColor: 'transparent',
            color: resendCooldown > 0 ? '#ccc' : '#0066cc',
            border: 'none',
            cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
            textDecoration: 'underline',
            fontSize: '14px'
          }}
        >
          {resendCooldown > 0
            ? `Reenviar em ${resendCooldown}s`
            : 'Reenviar código'}
        </button>
      </div>
    </div>
  )
}
