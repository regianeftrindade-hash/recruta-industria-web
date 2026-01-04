'use client'

import React, { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { isValidEmail, isValidCPF, isValidCNPJ } from '@/lib/security'
import EmailVerification from '@/app/components/EmailVerification'
import PasswordInput from '@/app/components/PasswordInput'

function RegistroContent() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'form'>('email')
  const [emailVerificationToken, setEmailVerificationToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome: '',
    cpf: '',
    cnpj: '',
    telefone: '',
    userType: 'professional',
    aceitaTermos: false,
  })

  const [validation, setValidation] = useState({
    emailError: '',
    passwordError: '',
    cpfError: '',
    cnpjError: '',
  })

  const handleEmailVerified = (token: string) => {
    setEmailVerificationToken(token)
    setFormData(prev => ({
      ...prev,
      email: prev.email
    }))
    setStep('form')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any
    const checked = (e.target as HTMLInputElement).checked

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validações
      if (!isValidEmail(formData.email)) {
        setValidation(prev => ({ ...prev, emailError: 'Email inválido' }))
        setLoading(false)
        return
      }

      if (formData.password.length < 8) {
        setValidation(prev => ({ ...prev, passwordError: 'Mínimo 8 caracteres' }))
        setLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Senhas não conferem')
        setLoading(false)
        return
      }

      if (!formData.aceitaTermos) {
        setError('Você deve aceitar os termos e condições')
        setLoading(false)
        return
      }

      // Validar CPF se for profissional
      if (formData.userType === 'professional' && formData.cpf) {
        const cpfLimpo = formData.cpf.replace(/\D/g, '')
        if (!isValidCPF(cpfLimpo)) {
          setValidation(prev => ({ ...prev, cpfError: 'CPF inválido' }))
          setLoading(false)
          return
        }
      }

      // Validar CNPJ se for empresa
      if (formData.userType === 'company' && formData.cnpj) {
        const cnpjLimpo = formData.cnpj.replace(/\D/g, '')
        if (!isValidCNPJ(cnpjLimpo)) {
          setValidation(prev => ({ ...prev, cnpjError: 'CNPJ inválido' }))
          setLoading(false)
          return
        }
      }

      // Enviar para API de registro
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          emailVerificationToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.feedback) {
          setError(`Senha fraca: ${data.feedback.join(', ')}`)
        } else {
          setError(data.error || 'Erro ao criar conta')
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'email') {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h1 style={{ color: '#001f3f', marginBottom: '30px' }}>Criar Conta</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Primeiro, vamos verificar seu email para garantir a segurança da sua conta.
        </p>
        <EmailVerification
          email={formData.email}
          onVerified={handleEmailVerified}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto', padding: '20px' }}>
      <h1 style={{ color: '#001f3f', marginBottom: '30px' }}>Criar Conta</h1>

      {error && (
        <div
          style={{
            backgroundColor: '#ffebee',
            border: '1px solid #ff5252',
            color: '#c62828',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: '#e8f5e9',
            border: '1px solid #4caf50',
            color: '#2e7d32',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}
        >
          ✅ Conta criada com sucesso! Redirecionando...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Email verificado ✓
          </label>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#e8f5e9',
              border: '1px solid #4caf50',
              borderRadius: '6px',
              color: '#2e7d32'
            }}
          >
            {formData.email}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Tipo de Usuário *
          </label>
          <select
            name="userType"
            value={formData.userType}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          >
            <option value="professional">Profissional</option>
            <option value="company">Empresa</option>
          </select>
        </div>

        {formData.userType === 'professional' ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Nome Completo *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Seu nome completo"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                CPF (opcional)
              </label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: validation.cpfError ? '2px solid #ff5252' : '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              {validation.cpfError && (
                <p style={{ color: '#ff5252', fontSize: '12px', margin: '5px 0 0 0' }}>
                  {validation.cpfError}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Razão Social *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Nome da empresa"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                CNPJ *
              </label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: validation.cnpjError ? '2px solid #ff5252' : '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              {validation.cnpjError && (
                <p style={{ color: '#ff5252', fontSize: '12px', margin: '5px 0 0 0' }}>
                  {validation.cnpjError}
                </p>
              )}
            </div>
          </>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Telefone (opcional)
          </label>
          <input
            type="tel"
            name="telefone"
            value={formData.telefone}
            onChange={handleInputChange}
            placeholder="(11) 9 9999-9999"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Senha *
          </label>
          <PasswordInput
            value={formData.password}
            onChange={handlePasswordChange}
            placeholder="Escolha uma senha forte"
            showStrength={true}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Confirmar Senha *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirme sua senha"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              name="aceitaTermos"
              checked={formData.aceitaTermos}
              onChange={handleInputChange}
              required
            />
            <span>
              Aceito os{' '}
              <a href="#" style={{ color: '#001f3f' }}>
                termos e condições
              </a>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.aceitaTermos}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#001f3f',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
        Já tem conta?{' '}
        <a
          href="/login"
          style={{
            color: '#001f3f',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Fazer login
        </a>
      </p>
    </div>
  )
}

export default function CriarContaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RegistroContent />
    </Suspense>
  )
}
