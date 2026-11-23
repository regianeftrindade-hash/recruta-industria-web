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
import { t } from '@/lib/i18n/translate';
import { safeJobReturnPath } from '@/lib/jobs/public-job-link';

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
        OAuthSignin: t('surface.auth.oauthStart'),
        OAuthCallback: t('surface.auth.oauthCallback'),
        OAuthAccountNotLinked: t('surface.auth.oauthLinked'),
        Callback: t('surface.auth.oauthGeneric'),
        Configuration: t('surface.auth.oauthConfig'),
        AccessDenied: t('surface.auth.oauthDenied'),
        google: t('surface.auth.oauthError'),
      };
      setErrorMessage(messages[authError] || t('surface.auth.oauthError'));
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
        const atual = data.email ? ` (${t('surface.auth.signedInAs')} ${data.email})` : '';
        setErrorMessage(
          `${t('surface.auth.noAdminPermission')}${atual}. ${t('surface.auth.noAdminHelp')}`,
        );
      })
      .catch(() => undefined);
  }, [sessionStatus, isAdminRedirect, redirectTo]);

  const [formData, setFormData] = useState({ email: '', senha: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.email || !formData.senha) {
      setErrorMessage(t('surface.auth.fillAll'));
      return;
    }

    if (!checkRateLimit(formData.email)) {
      setErrorMessage(t('surface.auth.tooMany'));
      setShowCaptcha(true);
      return;
    }

    if (showCaptcha && !captchaVerified) {
      setErrorMessage(t('surface.auth.captcha'));
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
        setErrorMessage(t('surface.auth.badCredentials'));
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
            t('surface.auth.wrongAdmin'),
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
      setErrorMessage(t('surface.auth.processError'));
      setLoading(false);
    }
  };

  const preserveLoginQuery = (tipo: 'profissional' | 'empresa') => {
    const params = new URLSearchParams();
    if (tipo === 'empresa') params.set('tipo', 'empresa');
    if (redirectTo?.startsWith('/')) {
      params.set('redirect', redirectTo);
    }
    const qs = params.toString();
    router.replace(qs ? `/login?${qs}` : '/login');
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
      setErrorMessage(t('surface.auth.noAdminCreate'));
      return;
    }
    if (tipoLogin === 'company') {
      router.push('/company/cadastro');
      return;
    }
    // Cadastro público: fluxo rápido (não a tela completa antiga).
    const jobReturn = safeJobReturnPath(redirectTo);
    router.push(jobReturn
      ? `/professional/cadastro?redirect=${encodeURIComponent(jobReturn)}`
      : '/professional/cadastro');
  };

  return (
    <div className={styles.page}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlow} aria-hidden />
      {loading && <PageLoader message={t('surface.auth.entering')} mode="overlay" />}

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
                ? t('surface.auth.adminAccess')
                : tipoLogin === 'company'
                  ? t('surface.auth.companyAccess')
                  : t('surface.auth.proAccess')}
            </span>
          </p>
          <p className={styles.supportLine}>
            {isAdminRedirect
              ? t('surface.auth.adminHint')
              : tipoLogin === 'company'
                ? t('surface.auth.companyHint')
                : t('surface.auth.proHint')}
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
              {t('surface.auth.professional')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTipoLogin('company');
                preserveLoginQuery('empresa');
              }}
              className={`${styles.tab} ${tipoLogin === 'company' ? styles.tabActive : ''}`}
            >
              {t('surface.auth.company')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {isAdminRedirect && (
            <p className={styles.error} style={{ color: '#C89B3C', borderColor: '#8D6B1F', background: 'rgba(200,155,60,0.12)' }}>
              {t('surface.auth.adminBanner')}
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
              {t('surface.auth.switchAdmin')}
            </button>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="login-email">
              {t('surface.auth.email')}
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
              {t('surface.auth.password')}
            </label>
            <input
              id="login-senha"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('surface.auth.passwordPlaceholder')}
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
            {t('surface.auth.showPassword')}
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
              {t('surface.auth.forgot')}
            </Link>
          </div>

          {showCaptcha && <MathCaptcha onVerify={(ok) => setCaptchaVerified(ok)} />}

          <button type="submit" disabled={loading} className={styles.btnPrimary}>
            {loading ? t('surface.auth.entering') : t('surface.auth.enter')}
          </button>
        </form>

        <GoogleSignInButton onClick={handleGoogleSignIn} disabled={loading} />

        {!isAdminRedirect && (
          <div className={styles.createAccountWrap}>
            <p className={styles.createAccountHint}>{t('surface.auth.noAccount')}</p>
            <button type="button" onClick={handleCadastro} className={styles.btnSecondary}>
              {t('surface.auth.register')}
            </button>
          </div>
        )}

        <div className={styles.footer}>
          <Link href="/" className={styles.footerLink}>
            {t('surface.auth.backHome')}
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<PageLoader message={t('surface.auth.loading')} />}>
      <LoginContent />
    </Suspense>
  );
}
