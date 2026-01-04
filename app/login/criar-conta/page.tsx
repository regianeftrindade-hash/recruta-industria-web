/**
 * 🔒 PÁGINA DE CRIAR CONTA - BLOQUEADA PARA ALTERAÇÕES
 * ======================================================
 * ⚠️ ATENÇÃO: Esta página foi finalizada e aprovada.
 * 
 * RESTRIÇÕES:
 * ✗ NÃO alterar layout ou espaçamento
 * ✗ NÃO remover componentes
 * ✗ NÃO modificar validações
 * ✗ NÃO alterar fluxo de registro
 * 
 * ALTERAÇÕES PERMITIDAS:
 * ✓ Ajustar validações de entrada
 * ✓ Atualizar mensagens de erro
 * ✓ Modificar requisitos de senha
 * 
 * Última atualização: 02/01/2026
 * Status: ✅ FINALIZADO E APROVADO
 */

"use client";

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { isValidEmail, isValidCPF, isValidCNPJ } from '@/lib/security';
import PasswordStrengthMeter from '@/app/components/PasswordStrengthMeter';
import { useSearchParams } from 'next/navigation';

function CriarContaContent() {
  const searchParams = useSearchParams();
  let tipo = searchParams.get('tipo') || 'professional';
  // Converte português para inglês se necessário
  if (tipo === 'profissional') tipo = 'professional';
  if (tipo === 'empresa') tipo = 'company';
  const userType = tipo as 'professional' | 'company';
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

  const [cnpjValidado, setCnpjValidado] = useState(false);
  const [cnpjData, setCnpjData] = useState<{ nome: string; email: string; telefone: string } | null>(null);
  const [consultandoCNPJ, setConsultandoCNPJ] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const consultarCNPJ = async (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (cnpjLimpo.length !== 14) {
      setValidation(prev => ({ ...prev, cnpjError: 'CNPJ deve ter 14 dígitos' }));
      setCnpjValidado(false);
      setCnpjData(null);
      return;
    }
    
    setConsultandoCNPJ(true);
    
    try {
      // Chama a API gratuita BrasilAPI
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      
      if (!response.ok) {
        setValidation(prev => ({ ...prev, cnpjError: 'CNPJ não encontrado na base de dados' }));
        setCnpjValidado(false);
        setCnpjData(null);
        setConsultandoCNPJ(false);
        return;
      }
      
      const dados = await response.json();
      
      // Mapeia os dados da API para o formulário
      const nomeEmpresa = dados.nome_fantasia || dados.razao_social || dados.nome || '';
      const emailEmpresa = dados.email || '';
      const telefoneEmpresa = dados.telefone || '';
      
      setCnpjData({
        nome: nomeEmpresa,
        email: emailEmpresa,
        telefone: telefoneEmpresa
      });
      
      setFormData(prev => ({ 
        ...prev, 
        nome: nomeEmpresa,
        email: emailEmpresa || prev.email,
        telefone: telefoneEmpresa || prev.telefone
      }));
      
      setCnpjValidado(true);
      setValidation(prev => ({ ...prev, cnpjError: '' }));
    } catch (error: any) {
      console.error('Erro ao consultar CNPJ:', error);
      setValidation(prev => ({ ...prev, cnpjError: 'Erro ao consultar CNPJ. Tente novamente.' }));
      setCnpjValidado(false);
      setCnpjData(null);
    } finally {
      setConsultandoCNPJ(false);
    }
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

    if (userType === 'company') {
      if (!formData.cnpj) {
        setError('CNPJ é obrigatório para empresas');
        return;
      }
      if (!validateCNPJ(formData.cnpj)) return;
      if (!cnpjValidado) {
        setError('CNPJ deve ser validado antes de prosseguir');
        return;
      }
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao registrar');
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Salvar dados do cadastro simples no localStorage para pré-preencher cadastro completo
      const dadosCadastro = {
        email: formData.email,
        password: formData.password,
        nome: formData.nome,
        cpf: formData.cpf,
        cnpj: formData.cnpj,
        telefone: formData.telefone,
        userType: userType,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('dadosCadastroSimples', JSON.stringify(dadosCadastro));
      
      setTimeout(() => {
        // Ambos devem fazer login para criar uma sessão autenticada
        const loginType = userType === 'company' ? 'empresa' : 'profissional';
        router.push(`/login?tipo=${loginType}`);
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
        padding: 'clamp(15px, 4vw, 20px)'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: 'clamp(30px, 6vw, 50px)',
          borderRadius: '20px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          width: '100%'
        }}>
          <h1 style={{ color: '#10b981', fontSize: 'clamp(28px, 6vw, 36px)', marginBottom: '20px' }}>✅ Sucesso!</h1>
          <p style={{ color: '#666', fontSize: 'clamp(16px, 3vw, 18px)', marginBottom: '10px' }}>
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
      padding: 'clamp(20px, 4vw, 50px) clamp(15px, 3vw, 20px)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: 'clamp(25px, 5vw, 50px)',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        width: '100%'
      }}>
        <h1 style={{
          color: '#001f3f',
          fontSize: 'clamp(22px, 5vw, 28px)',
          fontWeight: 900,
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          CRIAR CONTA
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: 'clamp(20px, 4vw, 30px)',
          fontSize: 'clamp(14px, 3vw, 16px)'
        }}>
          {userType === 'professional' ? 'Cadastro de Profissional' : 'Cadastro de Empresa'}
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            padding: 'clamp(10px, 2vw, 12px)',
            color: '#991b1b',
            marginBottom: '20px',
            fontSize: 'clamp(12px, 2vw, 14px)',
            fontWeight: 'bold'
          }}>
            ❌ {error}
          </div>
        )}

        {/* LEGENDA DE CAMPOS OBRIGATÓRIOS */}
        <div style={{ backgroundColor: '#e7f3ff', border: '3px solid #0066cc', borderRadius: '12px', padding: 'clamp(10px, 2vw, 14px)', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: 'clamp(8px, 2vw, 10px)' }}>
          <span style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 'bold', color: '#dc3545', flexShrink: 0 }}>*</span>
          <div>
            <strong style={{ color: '#0066cc', fontSize: 'clamp(12px, 2vw, 13px)', display: 'block' }}>CAMPOS OBRIGATÓRIOS</strong>
            <p style={{ margin: '4px 0 0 0', color: '#333', fontSize: 'clamp(11px, 1.5vw, 12px)' }}>Todos os campos marcados com asterisco são obrigatórios</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(15px, 3vw, 20px)'
        }}>
          {/* Para EMPRESA: CNPJ vem primeiro */}
          {userType === 'company' && (
            <div>
              <label style={{
                display: 'block',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#001f3f',
                fontSize: 'clamp(12px, 2.5vw, 14px)'
              }}>
                CNPJ *
              </label>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => {
                  const value = e.target.value;
                  const formatted = value
                    .replace(/\D/g, '')
                    .replace(/^(\d{2})(\d)/, '$1.$2')
                    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                    .replace(/\.(\d{3})(\d)/, '.$1/$2')
                    .replace(/(\d{4})(\d)/, '$1-$2')
                    .substring(0, 18);
                  
                  setFormData({ ...formData, cnpj: formatted });
                  
                  // Auto-consultar quando CNPJ estiver completo (18 caracteres)
                  if (formatted.length === 18) {
                    consultarCNPJ(formatted);
                  } else {
                    setCnpjValidado(false);
                    setCnpjData(null);
                    setValidation(prev => ({ ...prev, cnpjError: '' }));
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${cnpjValidado ? '#28a745' : validation.cnpjError ? '#ef4444' : '#cbd5e0'}`,
                  borderRadius: '10px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  color: '#001f3f',
                  backgroundColor: cnpjValidado ? '#e8f5e8' : '#fff'
                }}
                required
                disabled={loading}
              />
              {consultandoCNPJ && (
                <span style={{ color: '#0066cc', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  🔍 Consultando CNPJ...
                </span>
              )}
              {cnpjValidado && !consultandoCNPJ && (
                <span style={{ color: '#28a745', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  ✅ CNPJ válido! Dados carregados automaticamente
                </span>
              )}
              {validation.cnpjError && !consultandoCNPJ && (
                <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validation.cnpjError}
                </span>
              )}
            </div>
          )}

          {/* Nome/Razão Social */}
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
              }}              required              disabled={loading}
            />
            {validation.emailError && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {validation.emailError}
              </span>
            )}
          </div>

          {/* CPF para profissional */}
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
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Crie uma senha forte"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  validatePassword(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px',
                  border: `2px solid ${validation.passwordError ? '#ef4444' : '#cbd5e0'}`,
                  borderRadius: '10px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  color: '#001f3f'
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '5px'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
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
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px',
                  border: formData.password !== formData.confirmPassword && formData.confirmPassword ? '2px solid #ef4444' : '2px solid #cbd5e0',
                  borderRadius: '10px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  color: '#001f3f'
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '5px'
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
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

          {!formData.aceitaTermos && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '2px solid #ef4444',
              borderRadius: '10px',
              padding: '12px',
              color: '#991b1b',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ⚠️ Você deve aceitar os termos para prosseguir com o cadastro
            </div>
          )}

          {/* Botões */}
          <button
            type="submit"
            disabled={loading || !formData.aceitaTermos}
            style={{
              backgroundColor: !formData.aceitaTermos ? '#6c757d' : loading ? '#ccc' : '#001f3f',
              color: 'white',
              padding: '14px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading || !formData.aceitaTermos ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              marginTop: '10px',
              opacity: !formData.aceitaTermos ? 0.6 : 1
            }}
          >
            {loading ? 'Criando conta...' : !formData.aceitaTermos ? '❌ ACEITE OS TERMOS' : 'CRIAR CONTA'}
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
