"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isValidCPF } from '@/lib/security';
import PageLoader from '@/app/components/PageLoader';
import { READABLE_TEXT_STYLE } from '@/lib/theme';

export default function CadastroEmpresa() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    nome: '',
    responsavelNome: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [cnpjValue, setCnpjValue] = useState('');
  const [cpfValue, setCpfValue] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [cpfValidado, setCpfValidado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [contaProfissional, setContaProfissional] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setCheckingRegistration(false);
      return;
    }

    if (status !== 'authenticated' || !session?.user) return;

    const userType = (session.user as { userType?: string }).userType?.toUpperCase();
    if (userType === 'PROFESSIONAL') {
      setContaProfissional(true);
      setCheckingRegistration(false);
      return;
    }

    setCheckingRegistration(true);
    let redirecting = false;
    const user = session.user;
    void fetch('/api/company/check-registration', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.registrationComplete) {
          redirecting = true;
          router.replace('/company/dashboard-empresa');
          return;
        }

        setUsuarioLogado(true);
        setFormData((prev) => ({
          ...prev,
          email: user.email || prev.email,
          responsavelNome: user.name || prev.responsavelNome,
        }));
      })
      .catch(() => {
        setUsuarioLogado(true);
        setFormData((prev) => ({
          ...prev,
          email: user.email || prev.email,
          responsavelNome: user.name || prev.responsavelNome,
        }));
      })
      .finally(() => {
        if (!redirecting) setCheckingRegistration(false);
      });
  }, [status, session, router]);

  const formatarCNPJ = (valor: string) => {
    return valor
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatarCPF = (valor: string) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpjValue(formatarCNPJ(e.target.value));
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCPF(e.target.value);
    setCpfValue(formatado);
    setCpfValidado(false);
    setCpfError('');

    const limpo = formatado.replace(/\D/g, '');
    if (limpo.length === 11) {
      if (!isValidCPF(limpo)) {
        setCpfError('CPF inválido');
        return;
      }

      fetch('/api/auth/validate-cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: limpo }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setCpfValidado(true);
            setCpfError('');
          } else {
            setCpfError(data.message || 'CPF inválido');
          }
        })
        .catch(() => setCpfError('Erro ao validar CPF'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cnpjLimpo = cnpjValue.replace(/\D/g, '');
    const cpfLimpo = cpfValue.replace(/\D/g, '');

    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      setErrorMessage('Informe um CNPJ válido (14 dígitos).');
      return;
    }

    if (!formData.nome.trim()) {
      setErrorMessage('Informe a razão social da empresa.');
      return;
    }

    if (!formData.responsavelNome.trim()) {
      setErrorMessage('Informe o nome da pessoa responsável.');
      return;
    }

    if (!cpfLimpo || cpfLimpo.length !== 11 || !isValidCPF(cpfLimpo)) {
      setErrorMessage('Informe um CPF válido.');
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage('Informe o e-mail da empresa.');
      return;
    }

    if (!usuarioLogado) {
      if (!formData.password) {
        setErrorMessage('Informe uma senha.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('As senhas não conferem.');
        return;
      }
    }

    setLoading(true);

    try {
      if (usuarioLogado) {
        const res = await fetch('/api/company/update-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            nome: formData.nome.trim(),
            responsavelNome: formData.responsavelNome.trim(),
            cnpj: cnpjLimpo,
            responsavelCpf: cpfLimpo,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErrorMessage(data?.error || 'Erro ao finalizar cadastro.');
          setLoading(false);
          return;
        }

        setSuccessMessage('Cadastro finalizado com sucesso! Redirecionando...');
        router.push('/company/dashboard-empresa');
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'company',
          email: formData.email.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          name: formData.nome.trim(),
          responsavelNome: formData.responsavelNome.trim(),
          responsavelCpf: cpfLimpo,
          cnpj: cnpjLimpo,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail = data?.feedback?.length ? ` ${data.feedback.join(' ')}` : '';
        setErrorMessage((data?.error || 'Erro ao finalizar cadastro.') + detail);
        setLoading(false);
        return;
      }

      setSuccessMessage('Cadastro finalizado com sucesso! Redirecionando...');
      router.push('/company/success');
    } catch (err) {
      console.error('Erro no cadastro empresa:', err);
      setErrorMessage('Erro de rede ao finalizar cadastro. Tente novamente.');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '2px solid #8D6B1F',
    borderRadius: '8px',
    boxSizing: 'border-box',
    backgroundColor: '#000000',
    color: '#F2F2F2',
    fontSize: '15px',
    lineHeight: 1.45,
    ...READABLE_TEXT_STYLE,
  };

  if (status === 'loading' || checkingRegistration) {
    return (
      <PageLoader
        message={checkingRegistration ? 'Verificando cadastro...' : 'Carregando...'}
      />
    );
  }

  if (contaProfissional && session?.user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '40px 20px', color: '#F2F2F2', ...READABLE_TEXT_STYLE }} className="ri-readable">
        <div style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#111111', padding: '40px', borderRadius: '15px', border: '1px solid #8D6B1F', textAlign: 'center' }}>
          <h1 style={{ color: '#C89B3C', marginTop: 0 }}>Conta profissional detectada</h1>
          <p style={{ lineHeight: 1.6 }}>
            O e-mail <strong>{session.user.email}</strong> já está cadastrado como <strong>profissional</strong>
            {session.user.name ? ` (${session.user.name})` : ''}.
          </p>
          <p style={{ lineHeight: 1.6, color: '#ccc' }}>
            Para acessar como empresa, saia e entre com outro e-mail Google ou crie uma conta empresa com e-mail diferente.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <button
              type="button"
              onClick={() => router.push('/professional/dashboard')}
              style={{ padding: '12px', background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
            >
              Ir ao painel profissional
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/api/auth/logout'; }}
              style={{ padding: '12px', background: 'transparent', color: '#F2F2F2', border: '1px solid #8D6B1F', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
            >
              Sair e usar outro e-mail
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '40px 20px', color: '#F2F2F2', ...READABLE_TEXT_STYLE }} className="ri-readable">
      {loading && <PageLoader message="Enviando cadastro..." mode="overlay" />}
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#111111', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', border: '1px solid #8D6B1F' }}>
        <h1 style={{ color: '#C89B3C', textAlign: 'center', marginBottom: '30px' }}>CADASTRO EMPRESA</h1>

        {usuarioLogado && (
          <p style={{ color: '#F2F2F2', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
            Você entrou com Google. Complete os dados da empresa abaixo — não é necessário criar senha.
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {errorMessage && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}>
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div style={{ background: '#1a1508', color: '#F2F2F2', padding: '10px', borderRadius: '8px', fontWeight: 'bold', border: '1px solid #8D6B1F' }}>
              {successMessage}
            </div>
          )}

          <div>
            <label style={{ fontWeight: 'bold', color: '#C89B3C' }}>CNPJ *</label>
            <input type="text" placeholder="00.000.000/0000-00" value={cnpjValue} onChange={handleCnpjChange} style={inputStyle} required />
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#C89B3C' }}>RAZÃO SOCIAL *</label>
            <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} style={inputStyle} required />
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#C89B3C' }}>NOME DO RESPONSÁVEL *</label>
            <input
              type="text"
              placeholder="Pessoa que utiliza a plataforma"
              value={formData.responsavelNome}
              onChange={(e) => setFormData({ ...formData, responsavelNome: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#C89B3C' }}>CPF DO RESPONSÁVEL *</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={cpfValue}
              onChange={handleCpfChange}
              style={{ ...inputStyle, borderColor: cpfError ? '#dc3545' : cpfValidado ? '#C89B3C' : '#8D6B1F' }}
              required
            />
            {cpfError && <small style={{ color: '#dc3545' }}>{cpfError}</small>}
            {cpfValidado && !cpfError && <small style={{ color: '#C89B3C' }}>✓ CPF válido</small>}
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#C89B3C' }}>E-MAIL *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
              required
              readOnly={usuarioLogado}
              disabled={usuarioLogado}
            />
          </div>

          {!usuarioLogado && (
            <>
              <div>
                <label style={{ fontWeight: 'bold', color: '#C89B3C' }}>SENHA *</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={inputStyle} required minLength={8} />
                <small style={{ color: '#F2F2F2' }}>Mínimo 8 caracteres, com letras maiúsculas, minúsculas, números e símbolo.</small>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#C89B3C' }}>CONFIRMAR SENHA *</label>
                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} style={inputStyle} required minLength={8} />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
              color: '#000000',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '10px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Enviando...' : 'FINALIZAR CADASTRO'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <Link href="/login?tipo=empresa" style={{ fontSize: '13px', color: '#F2F2F2', textDecoration: 'underline' }}>
              Já tem conta? Entrar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
