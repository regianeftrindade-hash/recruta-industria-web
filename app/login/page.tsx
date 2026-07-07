"use client";

/* 🔒 LOGIN BLOQUEADO — Profissional e Empresa (06/07/2026) — não editar sem pedido explícito (ver .cursor/rules/login-page-lock.mdc) */

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { checkRateLimit } from '@/lib/security';
import MathCaptcha from '../components/MathCaptcha';
import LogoRecruta from '../components/LogoRecruta';
import PageLoader from '../components/PageLoader';
import styles from './login.module.css';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipoFromUrl = searchParams.get('tipo');
  const tipoLocked = tipoFromUrl === 'profissional' || tipoFromUrl === 'empresa';
  const [tipoLogin, setTipoLogin] = useState<'professional' | 'company'>(() =>
    tipoFromUrl === 'empresa' ? 'company' : 'professional',
  );
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    const tipo = searchParams.get('tipo');
    if (tipo === 'empresa') {
      setTipoLogin('company');
    } else if (tipo === 'profissional') {
      setTipoLogin('professional');
    }

    const authError = searchParams.get('error');
    if (authError) {
      const messages: Record<string, string> = {
        OAuthSignin: 'Não foi possível iniciar o login com Google.',
        OAuthCallback: 'Falha ao retornar do Google. Tente novamente.',
        OAuthAccountNotLinked: 'Este e-mail já está vinculado a outro método de login.',
        Callback: 'Erro na autenticação. Tente novamente.',
      };
      setErrorMessage(messages[authError] || 'Erro ao logar com Google.');
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({ email: '', senha: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.email || !formData.senha) {
      setErrorMessage('Por favor, preencha todos os campos');
      return;
    }

    if (!checkRateLimit(formData.email)) {
      setErrorMessage('Muitas tentativas de login. Tente novamente em 15 minutos.');
      setShowCaptcha(true);
      return;
    }

    if (showCaptcha && !captchaVerified) {
      setErrorMessage('Por favor, resolva o captcha antes de continuar.');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.senha,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage('Email ou senha inválidos');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        const redirectTo = searchParams.get('redirect');
        if (redirectTo?.startsWith('/')) {
          router.push(redirectTo);
          return;
        }

        const typeRes = await fetch('/api/auth/get-user-type', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });

        const data = await typeRes.json();

        if (data.userType === 'company' || data.userType === 'COMPANY') {
          router.push('/company/dashboard-empresa');
        } else {
          const profileRes = await fetch('/api/professional/profile', {
            credentials: 'include',
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            router.push(
              profile.registrationComplete
                ? '/professional/dashboard'
                : '/professional/register'
            );
          } else {
            router.push('/professional/register');
          }
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setErrorMessage('Erro ao processar login.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setErrorMessage('');

    const isCompany =
      tipoLogin === 'company' || searchParams.get('tipo') === 'empresa';

    if (typeof document !== 'undefined') {
      document.cookie = `login_intent=${isCompany ? 'company' : 'professional'}; path=/; max-age=600; SameSite=Lax`;
    }

    void signIn('google', {
      callbackUrl: isCompany ? '/company/dashboard-empresa' : '/professional/dashboard',
    });
  };

  const handleCadastro = () => {
    router.push(tipoLogin === 'company' ? '/company/register' : '/professional/register');
  };

  return (
    <div className={styles.page}>
      {loading && <PageLoader message="Entrando..." mode="overlay" />}

      <div className={styles.card}>
        <div className={styles.loginHeader}>
          <div className={styles.logoWrap}>
            <LogoRecruta size="sm" as="h1" depth />
          </div>

          <p className={styles.subtitle}>
            <span className={styles.accessTag}>
              {tipoLogin === 'company' ? 'Acesso Empresa' : 'Acesso Profissional'}
            </span>
          </p>
        </div>

        {!tipoLocked && (
          <div className={styles.tabs}>
            <button
              type="button"
              onClick={() => {
                setTipoLogin('professional');
                router.replace('/login?tipo=profissional');
              }}
              className={`${styles.tab} ${tipoLogin === 'professional' ? styles.tabActive : ''}`}
            >
              Profissional
            </button>
            <button
              type="button"
              onClick={() => {
                setTipoLogin('company');
                router.replace('/login?tipo=empresa');
              }}
              className={`${styles.tab} ${tipoLogin === 'company' ? styles.tabActive : ''}`}
            >
              Empresa
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {errorMessage && <p className={styles.error}>{errorMessage}</p>}

          <input
            type="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={styles.input}
            autoComplete="email"
          />

          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            value={formData.senha}
            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
            className={styles.input}
            autoComplete="current-password"
          />

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Mostrar senha
          </label>

          {showCaptcha && <MathCaptcha onVerify={(ok) => setCaptchaVerified(ok)} />}

          <button type="submit" disabled={loading} className={styles.btnPrimary}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={styles.btnGoogle}
        >
          <svg className={styles.googleIcon} viewBox="0 0 48 48" aria-hidden>
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303c-1.149 3.658-4.675 6.348-8.303 6.348-2.809 0-5.438-1.084-7.409-2.883l-6.522 5.025C9.505 39.556 16.227 44 24 44c5.166 0 9.86-1.977 13.409-5.192l6.19-5.238C42.022 35.091 44 29.964 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          Entrar com Google
        </button>

        <button type="button" onClick={handleCadastro} className={styles.btnSecondary}>
          Criar conta
        </button>

        <div className={styles.footer}>
          <Link href="/" className={styles.footerLink}>
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<PageLoader message="Carregando..." />}>
      <LoginContent />
    </Suspense>
  );
}
