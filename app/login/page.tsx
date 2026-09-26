"use client";

/* 🔒 LOGIN BLOQUEADO — Profissional e Empresa (06/07/2026) — não editar sem pedido explícito (ver .cursor/rules/login-page-lock.mdc) */

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { checkRateLimit } from '@/lib/security';
import MathCaptcha from '../components/MathCaptcha';
import LogoRecruta from '../components/LogoRecruta';
import PageLoader from '../components/PageLoader';
import ProfessionalVitrinePitch from '@/components/auth/ProfessionalVitrinePitch';
import CompanyVitrinePitch from '@/components/auth/CompanyVitrinePitch';
import GoogleSignInButton from '@/app/components/GoogleSignInButton';
import styles from './login.module.css';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();
  const redirectTo = searchParams.get('redirect');
  const isAdminRedirect = !!redirectTo?.startsWith('/admin');
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
        Configuration: 'Login com Google não está configurado no servidor. Confira NEXTAUTH_URL e as credenciais Google.',
        AccessDenied: 'Acesso com Google recusado. Tente outro e-mail ou o login com senha.',
        google: 'Erro ao logar com Google.',
      };
      setErrorMessage(messages[authError] || 'Erro ao logar com Google.');
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!isAdminRedirect || !redirectTo || sessionStatus !== 'authenticated') return;

    void fetch('/api/auth/is-admin', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { isAdmin?: boolean; email?: string | null }) => {
        if (data.isAdmin) {
          window.location.href = redirectTo;
          return;
        }
        const atual = data.email ? ` (logado como ${data.email})` : '';
        setErrorMessage(
          `Sem permissão de admin${atual}. Clique em "Sair e entrar com e-mail admin" e use um e-mail autorizado (ADMIN_EMAILS) ou a conta de teste paizaonacozinha.`,
        );
      })
      .catch(() => undefined);
  }, [sessionStatus, isAdminRedirect, redirectTo]);

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
        if (redirectTo?.startsWith('/admin')) {
          const adminRes = await fetch('/api/auth/is-admin', { credentials: 'include' });
          const adminData = await adminRes.json().catch(() => ({}));
          if (adminData?.isAdmin) {
            window.location.href = redirectTo;
            return;
          }
          setErrorMessage(
            'Este e-mail não tem permissão de admin. Confira ADMIN_EMAILS no .env e entre com o e-mail correto.',
          );
          setLoading(false);
          return;
        }

        if (redirectTo?.startsWith('/')) {
          window.location.href = redirectTo;
          return;
        }

        const typeRes = await fetch('/api/auth/get-user-type', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: formData.email })
        });

        const data = await typeRes.json();

        if (data.userType === 'company' || data.userType === 'COMPANY') {
          router.push('/company/dashboard-empresa');
        } else {
          router.push('/professional/dashboard');
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setErrorMessage('Erro ao processar login.');
      setLoading(false);
    }
  };

  const preserveLoginQuery = (tipo: 'profissional' | 'empresa') => {
    const params = new URLSearchParams();
    params.set('tipo', tipo);
    if (redirectTo?.startsWith('/')) {
      params.set('redirect', redirectTo);
    }
    router.replace(`/login?${params.toString()}`);
  };

  const handleGoogleSignIn = () => {
    setErrorMessage('');

    const isCompany =
      !isAdminRedirect
      && (tipoLogin === 'company' || searchParams.get('tipo') === 'empresa');

    if (typeof document !== 'undefined') {
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `login_intent=${isCompany ? 'company' : 'professional'}; path=/; max-age=600; SameSite=Lax${secure}`;
    }

    // Entrar com Google → painel (não cadastro). Cadastro incompleto é tratado no painel/register.
    const defaultCallback = isCompany
      ? '/company/dashboard-empresa'
      : '/professional/dashboard';
    const targetPath = redirectTo?.startsWith('/') ? redirectTo : defaultCallback;
    const callbackUrl = `${window.location.origin}${targetPath}`;

    void signIn('google', { callbackUrl });
  };

  const handleCadastro = () => {
    if (isAdminRedirect) {
      setErrorMessage('Para acessar o admin, entre com o e-mail de administrador. Não use criar conta.');
      return;
    }
    router.push(tipoLogin === 'company' ? '/company/cadastro' : '/professional/cadastro');
  };

  return (
    <div className={styles.page}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlow} aria-hidden />
      {loading && <PageLoader message="Entrando..." mode="overlay" />}

      <div className={styles.authShell}>
        {!isAdminRedirect && tipoLogin === 'professional' && <ProfessionalVitrinePitch />}
        {!isAdminRedirect && tipoLogin === 'company' && <CompanyVitrinePitch />}

        <div className={styles.card}>
        <div className={styles.loginHeader}>
          <div className={styles.logoWrap}>
            <LogoRecruta size="sm" as="h1" depth />
          </div>

          <p className={styles.subtitle}>
            <span className={styles.accessTag}>
              {isAdminRedirect
                ? 'Acesso Admin'
                : tipoLogin === 'company'
                  ? 'Acesso Empresa'
                  : 'Acesso Profissional'}
            </span>
          </p>
          <p className={styles.supportLine}>
            {isAdminRedirect
              ? 'Entre com o e-mail autorizado do painel.'
              : tipoLogin === 'company'
                ? 'Acesse o painel da sua indústria.'
                : 'Acesse seu perfil profissional.'}
          </p>
        </div>

        {!tipoLocked && !isAdminRedirect && (
          <div className={styles.tabs}>
            <button
              type="button"
              onClick={() => {
                setTipoLogin('professional');
                preserveLoginQuery('profissional');
              }}
              className={`${styles.tab} ${tipoLogin === 'professional' ? styles.tabActive : ''}`}
            >
              Profissional
            </button>
            <button
              type="button"
              onClick={() => {
                setTipoLogin('company');
                preserveLoginQuery('empresa');
              }}
              className={`${styles.tab} ${tipoLogin === 'company' ? styles.tabActive : ''}`}
            >
              Empresa
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {isAdminRedirect && (
            <p className={styles.error} style={{ color: '#C89B3C', borderColor: '#8D6B1F', background: 'rgba(200,155,60,0.12)' }}>
              Acesso administrativo — use o e-mail de admin do sistema.
            </p>
          )}
          {errorMessage && <p className={styles.error}>{errorMessage}</p>}
          {isAdminRedirect && sessionStatus === 'authenticated' && (
            <button
              type="button"
              onClick={() => { window.location.href = '/api/auth/logout?redirect=/admin'; }}
              className={styles.btnPrimary}
              style={{ marginBottom: 12 }}
            >
              Sair e entrar com e-mail admin
            </button>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="login-email">
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={styles.input}
              autoComplete="email"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="login-senha">
              Senha
            </label>
            <input
              id="login-senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              className={styles.input}
              autoComplete="current-password"
            />
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Mostrar senha
          </label>

          <div className={styles.forgotWrap}>
            <Link
              href={
                tipoLogin === 'company'
                  ? '/esqueci-senha?tipo=empresa'
                  : '/esqueci-senha?tipo=profissional'
              }
              className={styles.forgotLink}
            >
              Esqueci a senha
            </Link>
          </div>

          {showCaptcha && <MathCaptcha onVerify={(ok) => setCaptchaVerified(ok)} />}

          <button type="submit" disabled={loading} className={styles.btnPrimary}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <GoogleSignInButton onClick={handleGoogleSignIn} disabled={loading} />

        {!isAdminRedirect && (
          <div className={styles.createAccountWrap}>
            <p className={styles.createAccountHint}>Ainda não tem conta? Entre ou faça cadastro.</p>
            <button type="button" onClick={handleCadastro} className={styles.btnSecondary}>
              Fazer cadastro
            </button>
          </div>
        )}

        <div className={styles.footer}>
          <Link href="/" className={styles.footerLink}>
            ← Voltar para a página inicial
          </Link>
        </div>
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
