"use client";

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { isValidEmail, isValidCPF, isValidCNPJ } from '@/lib/security';
import PasswordStrengthMeter from '@/app/components/PasswordStrengthMeter';
import { useSearchParams } from 'next/navigation';

function CriarContaContent() {
  const searchParams = useSearchParams();
  const userType = (searchParams.get('tipo') || 'professional') as 'professional' | 'company';
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome: '',
    cpf: '',
    cnpj: '',
    telefone: '',
    aceitaTermos: false,
  });

  const [validation, setValidation] = useState({
    emailError: '',
    passwordError: '',
    cpfError: '',
    cnpjError: '',
  });

  const validateEmail = (email: string) => {
    if (!isValidEmail(email)) {
      setValidation(prev => ({ ...prev, emailError: 'Email inválido' }));
      return false;
    }
    setValidation(prev => ({ ...prev, emailError: '' }));
    return true;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      setValidation(prev => ({ ...prev, passwordError: 'Mínimo 8 caracteres' }));
      return false;
    }
    setValidation(prev => ({ ...prev, passwordError: '' }));
    return true;
  };

  const validateCPF = (cpf: string) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length > 0 && !isValidCPF(cpfLimpo)) {
      setValidation(prev => ({ ...prev, cpfError: 'CPF inválido' }));
      return false;
    }
    setValidation(prev => ({ ...prev, cpfError: '' }));
    return true;
  };

  const validateCNPJ = (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length > 0 && !isValidCNPJ(cnpjLimpo)) {
      setValidation(prev => ({ ...prev, cnpjError: 'CNPJ inválido' }));
      return false;
    }
    setValidation(prev => ({ ...prev, cnpjError: '' }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.aceitaTermos) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!validateEmail(formData.email)) return;
    if (!validatePassword(formData.password)) return;

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (userType === 'professional' && formData.cpf) {
      if (!validateCPF(formData.cpf)) return;
    }

    if (userType === 'company' && formData.cnpj) {
      if (!validateCNPJ(formData.cnpj)) return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          userType,
          cpf: formData.cpf,
          cnpj: formData.cnpj,
          nome: formData.nome,
          telefone: formData.telefone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao registrar');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/login?tipo=${userType === 'company' ? 'empresa' : 'profissional'}`);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar. Tente novamente.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f4f8',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '50px',
          borderRadius: '20px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ color: '#10b981', fontSize: '36px', marginBottom: '20px' }}>✅ Sucesso!</h1>
          <p style={{ color: '#666', fontSize: '18px', marginBottom: '10px' }}>
            Conta criada com sucesso!
          </p>
          <p style={{ color: '#999' }}>
            Redirecionando para login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f0f4f8',
      minHeight: '100vh',
      padding: '50px 20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '50px',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#001f3f',
          fontSize: '28px',
          fontWeight: 900,
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          CRIAR CONTA
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '30px'
        }}>
          {userType === 'professional' ? 'Cadastro de Profissional' : 'Cadastro de Empresa'}
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            padding: '12px',
            color: '#991b1b',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#001f3f',
              fontSize: '14px'
            }}>
              Email *
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                validateEmail(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${validation.emailError ? '#ef4444' : '#cbd5e0'}`,
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                color: '#001f3f'
              }}
              disabled={loading}
            />
            {validation.emailError && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {validation.emailError}
              </span>
            )}
          </div>

          {/* Nome */}
          <div>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#001f3f',
              fontSize: '14px'
            }}>
              {userType === 'professional' ? 'Nome Completo' : 'Razão Social'} *
            </label>
            <input
              type="text"
              placeholder={userType === 'professional' ? 'Seu nome completo' : 'Nome da empresa'}
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #cbd5e0',
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                color: '#001f3f'
              }}
              required
              disabled={loading}
            />
          </div>

          {/* CPF ou CNPJ */}
          {userType === 'professional' && (
            <div>
              <label style={{
                display: 'block',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#001f3f',
                fontSize: '14px'
              }}>
                CPF
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => {
                  setFormData({ ...formData, cpf: e.target.value });
                  validateCPF(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${validation.cpfError ? '#ef4444' : '#cbd5e0'}`,
                  borderRadius: '10px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  color: '#001f3f'
                }}
                disabled={loading}
              />
              {validation.cpfError && (
                <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validation.cpfError}
                </span>
              )}
            </div>
          )}

          {userType === 'company' && (
            <div>
              <label style={{
                display: 'block',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#001f3f',
                fontSize: '14px'
              }}>
                CNPJ
              </label>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => {
                  setFormData({ ...formData, cnpj: e.target.value });
                  validateCNPJ(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${validation.cnpjError ? '#ef4444' : '#cbd5e0'}`,
                  borderRadius: '10px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  color: '#001f3f'
                }}
                disabled={loading}
              />
              {validation.cnpjError && (
                <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validation.cnpjError}
                </span>
              )}
            </div>
          )}

          {/* Telefone */}
          <div>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#001f3f',
              fontSize: '14px'
            }}>
              Telefone
            </label>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #cbd5e0',
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                color: '#001f3f'
              }}
              disabled={loading}
            />
          </div>

          {/* Senha */}
          <div>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#001f3f',
              fontSize: '14px'
            }}>
              Senha *
            </label>
            <input
              type="password"
              placeholder="Crie uma senha forte"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                validatePassword(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${validation.passwordError ? '#ef4444' : '#cbd5e0'}`,
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                color: '#001f3f'
              }}
              disabled={loading}
            />
            {validation.passwordError && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {validation.passwordError}
              </span>
            )}
            {formData.password && (
              <PasswordStrengthMeter password={formData.password} />
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#001f3f',
              fontSize: '14px'
            }}>
              Confirmar Senha *
            </label>
            <input
              type="password"
              placeholder="Confirme sua senha"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: formData.password !== formData.confirmPassword && formData.confirmPassword ? '2px solid #ef4444' : '2px solid #cbd5e0',
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                color: '#001f3f'
              }}
              disabled={loading}
            />
            {formData.password !== formData.confirmPassword && formData.confirmPassword && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                As senhas não conferem
              </span>
            )}
          </div>

          {/* Termos */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px'
          }}>
            <input
              type="checkbox"
              id="termos"
              checked={formData.aceitaTermos}
              onChange={(e) => setFormData({ ...formData, aceitaTermos: e.target.checked })}
              style={{
                cursor: 'pointer',
                width: '18px',
                height: '18px'
              }}
              disabled={loading}
            />
            <label htmlFor="termos" style={{
              cursor: 'pointer',
              fontSize: '14px',
              color: '#666',
              margin: 0
            }}>
              Aceito os termos de serviço e política de privacidade *
            </label>
          </div>

          {/* Botões */}
          <button
            type="submit"
            disabled={loading || !formData.aceitaTermos}
            style={{
              backgroundColor: loading ? '#ccc' : '#001f3f',
              color: 'white',
              padding: '14px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              marginTop: '10px'
            }}
          >
            {loading ? 'Criando conta...' : 'CRIAR CONTA'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            disabled={loading}
            style={{
              backgroundColor: 'transparent',
              color: '#001f3f',
              padding: '14px',
              border: '2px solid #001f3f',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
          >
            Voltar para Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CriarConta() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CriarContaContent />
    </Suspense>
  );
}
