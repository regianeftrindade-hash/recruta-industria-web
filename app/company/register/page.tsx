"use client";

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { isValidCPF } from '@/lib/security';
import { t } from '@/lib/i18n/translate';
import RegistrationCountryField from '@/components/identity/RegistrationCountryField';
import PageLoader from '@/app/components/PageLoader';
import { READABLE_TEXT_STYLE } from '@/lib/theme';
import styles from '@/app/professional/register/register.module.css';
import layout from './cadastro-empresa.module.css';
import RegisterTermoItem from '@/app/professional/register/RegisterTermoItem';
import { matchesCompanyTestBypass } from '@/lib/company/company-test-bypass-shared';
import { AuthAtmosphere } from '@/components/shared/AuthAtmosphere';
import LogoRecruta from '@/app/components/LogoRecruta';
import RegisterSectionHeader from '@/components/ui/RegisterSectionHeader';
import DeleteAccountControl from '@/components/shared/DeleteAccountControl';
import { useCompanyDashboardTabOptional } from '@/components/company/CompanyDashboardTabContext';

const twoCols = { '--fields-per-row': '2' } as React.CSSProperties;

function rotuloVerificacao(status: string): string {
  if (status === 'VERIFIED') return t("registration.ui.aprovado");
  if (status === 'REJECTED') return t("registration.ui.reprovado");
  return t("registration.ui.em-analise");
}

function CadastroEmpresaContent({ incorporado = false }: { incorporado?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abaPainel = useCompanyDashboardTabOptional();
  const isEditMode = incorporado || searchParams.get('edit') === '1';
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    nome: '',
    responsavelNome: '',
    email: '',
    password: '',
    confirmPassword: '',
    endereco: '',
  });

  const [pais, setPais] = useState('BR');
  const [telefoneValue, setTelefoneValue] = useState('');

  const [cnpjValue, setCnpjValue] = useState('');
  const [cpfValue, setCpfValue] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [cpfValidado, setCpfValidado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [salvoNoBotao, setSalvoNoBotao] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [contaJaCompleta, setContaJaCompleta] = useState(false);
  const [sessionWaitTimedOut, setSessionWaitTimedOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [editandoResponsavel, setEditandoResponsavel] = useState(false);
  const [termos, setTermos] = useState({
    autorizoDados: false,
    declaroVerdadeiro: false,
    aceitoLGPD: false,
  });
  const [statusVerificacao, setStatusVerificacao] = useState('PENDING');
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [contaProfissional, setContaProfissional] = useState(false);
  const [isTestBypass, setIsTestBypass] = useState(false);
  const [emailLogin, setEmailLogin] = useState('');
  const [emailCorporativo, setEmailCorporativo] = useState('');
  const [emailVerificado, setEmailVerificado] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailMensagem, setEmailMensagem] = useState('');
  const [emailErro, setEmailErro] = useState('');
  const [cartaoCnpjUrl, setCartaoCnpjUrl] = useState('');
  const [cartaoCnpjNome, setCartaoCnpjNome] = useState('');
  const [enviandoCartao, setEnviandoCartao] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [fotoResponsavelUrl, setFotoResponsavelUrl] = useState('');
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const cartaoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const checagemEmailRef = useRef<string | null>(null);

  const formatarTelefone = (valor: string) => {
    const telefoneLimpo = valor.replace(/\D/g, '');
    if (!telefoneLimpo) return '';
    if (telefoneLimpo.length <= 2) return `(${telefoneLimpo}`;
    if (telefoneLimpo.length <= 7) {
      return `(${telefoneLimpo.slice(0, 2)}) ${telefoneLimpo.slice(2)}`;
    }
    return `(${telefoneLimpo.slice(0, 2)}) ${telefoneLimpo.slice(2, 7)}-${telefoneLimpo.slice(7, 11)}`;
  };

  useEffect(() => {
    const emailFromUrl = searchParams.get('emailCorporativo');
    const verificado = searchParams.get('emailVerificado') === '1';
    const erroEmail = searchParams.get('emailErro');

    if (erroEmail) {
      setEmailErro(decodeURIComponent(erroEmail));
    }

    if (emailFromUrl) {
      setEmailCorporativo(emailFromUrl);
    }

    if (verificado && emailFromUrl) {
      setEmailVerificado(true);
      setEmailEnviado(true);
      setEmailMensagem(t("registration.ui.e-mail-corporativo-confirmado-com-sucesso-voce-pode-continuar-o-"));
      setEmailErro('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!emailEnviado || emailVerificado || !emailCorporativo.trim()) return;

    const interval = window.setInterval(() => {
      void fetch(`/api/company/corporate-email-status?email=${encodeURIComponent(emailCorporativo.trim())}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.verified) {
            setEmailVerificado(true);
            setEmailMensagem(t("registration.ui.e-mail-corporativo-confirmado-com-sucesso-voce-pode-continuar-o-"));
            setEmailErro('');
          }
        })
        .catch(() => undefined);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [emailEnviado, emailVerificado, emailCorporativo]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setCheckingRegistration(false);
      setContaJaCompleta(false);
      setUsuarioLogado(false);
      return;
    }

    if (status !== 'authenticated' || !session?.user?.email) return;

    const email = session.user.email;
    if (checagemEmailRef.current === email) return;

    const bypassByEmail = matchesCompanyTestBypass({
      email,
      userName: session.user.name,
    });

    // Conta de teste: redireciona imediatamente, sem esperar a API
    if (bypassByEmail && !isEditMode) {
      setIsTestBypass(true);
      router.replace('/company/dashboard-empresa');
      return;
    }

    const userType = (session.user as { userType?: string }).userType?.toUpperCase();
    // Conta de teste: nunca bloqueia como “profissional” — libera painel
    if (userType === 'PROFESSIONAL' && !bypassByEmail) {
      setContaProfissional(true);
      setCheckingRegistration(false);
      return;
    }

    if (!incorporado) setCheckingRegistration(true);
    setContaJaCompleta(false);
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setCheckingRegistration(false);
    }, 8000);
    const user = session.user;
    void fetch('/api/company/check-registration', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const testBypass = data?.testBypass === true || bypassByEmail;
        setIsTestBypass(testBypass);

        if (testBypass && !isEditMode) {
          router.replace('/company/dashboard-empresa');
          return;
        }

        if (data?.registrationComplete && !isEditMode) {
          setContaJaCompleta(true);
          return;
        }

        setUsuarioLogado(true);
        const userData = data?.user;
        const statusApi = String(data?.verification?.verificationStatus || 'PENDING');
        setStatusVerificacao(statusApi);
        setMotivoReprovacao(
          statusApi === 'REJECTED' && typeof data?.verification?.rejectionReason === 'string'
            ? data.verification.rejectionReason
            : '',
        );
        setEmailLogin(user.email || '');
        setFormData((prev) => ({
          ...prev,
          email: user.email || prev.email,
          responsavelNome: userData?.responsavelNome || user.name || prev.responsavelNome,
          nome: userData?.razaoSocial || prev.nome,
          endereco: userData?.endereco || prev.endereco,
        }));

        if (userData?.emailCorporativo) {
          setEmailCorporativo(String(userData.emailCorporativo));
          if (userData.emailCorporativoVerificado) {
            setEmailVerificado(true);
            setEmailEnviado(true);
            setEmailMensagem(t("registration.ui.e-mail-corporativo-ja-confirmado"));
          }
        }

        if (userData?.cartaoCnpjUrl) {
          setCartaoCnpjUrl(String(userData.cartaoCnpjUrl));
          setCartaoCnpjNome(t("registration.ui.cartao-cnpj-enviado"));
        }

        if (userData?.logoUrl) {
          setLogoUrl(String(userData.logoUrl));
        }

        if (userData?.fotoResponsavelUrl) {
          setFotoResponsavelUrl(String(userData.fotoResponsavelUrl));
        }

        if (userData?.telefone) {
          setTelefoneValue(formatarTelefone(String(userData.telefone)));
        }

        if (isEditMode && userData) {
          if (userData.cnpj) {
            const cnpjDigits = String(userData.cnpj).replace(/\D/g, '');
            setCnpjValue(formatarCNPJ(cnpjDigits));
          }
          if (userData.responsavelCpf) {
            const cpfDigits = String(userData.responsavelCpf).replace(/\D/g, '');
            const cpfFormatado = formatarCPF(cpfDigits);
            setCpfValue(cpfFormatado);
            if (cpfDigits.length === 11 && isValidCPF(cpfDigits)) {
              setCpfValidado(true);
            }
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (bypassByEmail) {
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
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (!cancelled) {
          checagemEmailRef.current = email;
          setCheckingRegistration(false);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    status,
    session?.user?.email,
    session?.user?.name,
    (session?.user as { userType?: string } | undefined)?.userType,
    incorporado,
    isEditMode,
    router,
  ]);

  useEffect(() => {
    if (status !== 'loading') {
      setSessionWaitTimedOut(false);
      return;
    }
    const t = window.setTimeout(() => setSessionWaitTimedOut(true), 5000);
    return () => window.clearTimeout(t);
  }, [status]);
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

  const atualizarEmailCorporativo = (valor: string) => {
    setEmailCorporativo(valor);
    setEmailVerificado(false);
    setEmailEnviado(false);
    setEmailMensagem('');
    setEmailErro('');
  };

  const handleEnviarConfirmacaoEmail = async () => {
    const email = emailCorporativo.trim();
    if (!email) {
      setEmailErro(t("registration.ui.informe-o-e-mail-corporativo-da-empresa"));
      return;
    }

    setEnviandoEmail(true);
    setEmailErro('');
    setEmailMensagem('');

    try {
      const res = await fetch('/api/company/send-corporate-email-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setEmailErro(data?.error || t("registration.ui.nao-foi-possivel-enviar-o-e-mail-de-confirmacao"));
        return;
      }

      if (data?.verified) {
        setEmailVerificado(true);
        setEmailEnviado(true);
        setEmailMensagem(data?.message || t("registration.ui.e-mail-corporativo-ja-confirmado"));
        return;
      }

      setEmailEnviado(true);
      setEmailMensagem(
        data?.message
        || t("registration.ui.enviamos-confirmacao").replace("{email}", email),
      );
    } catch {
      setEmailErro(t("registration.ui.erro-de-rede-ao-enviar-o-e-mail-de-confirmacao"));
    } finally {
      setEnviandoEmail(false);
    }
  };

  const handleCartaoCnpjUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEnviandoCartao(true);
    setErrorMessage('');

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('type', 'company-cnpj');

      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.file?.url) {
        setErrorMessage(data?.error || t("registration.ui.erro-ao-enviar-o-cartao-cnpj"));
        return;
      }

      setCartaoCnpjUrl(data.file.url);
      setCartaoCnpjNome(data.file.name || file.name);
    } catch {
      setErrorMessage(t("registration.ui.erro-de-rede-ao-enviar-o-cartao-cnpj"));
    } finally {
      setEnviandoCartao(false);
      e.target.value = '';
    }
  };

  const uploadImagemEmpresa = async (
    file: File,
    type: 'company-logo' | 'company-responsavel',
  ): Promise<string | null> => {
    const body = new FormData();
    body.append('file', file);
    body.append('type', type);

    const res = await fetch('/api/upload', { method: 'POST', body });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.file?.url) {
      setErrorMessage(data?.error || t("registration.ui.erro-ao-enviar-a-imagem"));
      return null;
    }

    return String(data.file.url);
  };

  const persistBrandImages = async (nextLogo?: string, nextFoto?: string) => {
    if (!usuarioLogado && status !== 'authenticated') return;
    const payload: Record<string, string> = {};
    const logo = nextLogo ?? logoUrl;
    const foto = nextFoto ?? fotoResponsavelUrl;
    if (logo) payload.logoUrl = logo;
    if (foto) payload.fotoResponsavelUrl = foto;
    if (Object.keys(payload).length === 0) return;

    try {
      await fetch('/api/company/update-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
    } catch {
      /* preview local já atualizado; falha de persistência não bloqueia */
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage(t("registration.ui.envie-uma-imagem-jpg-png-webp-ou-gif"));
      e.target.value = '';
      return;
    }

    setEnviandoLogo(true);
    setErrorMessage('');
    try {
      const url = await uploadImagemEmpresa(file, 'company-logo');
      if (url) {
        setLogoUrl(url);
        await persistBrandImages(url, fotoResponsavelUrl);
      }
    } catch {
      setErrorMessage(t("registration.ui.erro-de-rede-ao-enviar-o-logotipo"));
    } finally {
      setEnviandoLogo(false);
      e.target.value = '';
    }
  };

  const handleFotoResponsavelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage(t("registration.ui.envie-uma-imagem-jpg-png-webp-ou-gif"));
      e.target.value = '';
      return;
    }

    setEnviandoFoto(true);
    setErrorMessage('');
    try {
      const url = await uploadImagemEmpresa(file, 'company-responsavel');
      if (url) {
        setFotoResponsavelUrl(url);
        await persistBrandImages(logoUrl, url);
      }
    } catch {
      setErrorMessage(t("registration.ui.erro-de-rede-ao-enviar-a-foto-do-responsavel"));
    } finally {
      setEnviandoFoto(false);
      e.target.value = '';
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCPF(e.target.value);
    setCpfValue(formatado);
    setCpfValidado(false);
    setCpfError('');

    const limpo = formatado.replace(/\D/g, '');
    if (limpo.length === 11) {
      if (!isValidCPF(limpo)) {
        setCpfError(t("registration.ui.cpf-invalido"));
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
            setCpfError(data.message || t("registration.ui.cpf-invalido"));
          }
        })
        .catch(() => setCpfError(t("registration.ui.erro-ao-validar-cpf")));
    }
  };

  const voltarAoPainel = () => {
    if (abaPainel) {
      abaPainel.setActiveTab('vagas');
      return;
    }
    router.push('/company/dashboard-empresa');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && !editandoEmpresa && !editandoResponsavel) return;
    setErrorMessage('');
    setSuccessMessage('');

    if (!usuarioLogado && !isEditMode && pais !== 'BR') {
      setErrorMessage(t('registration.country.unavailable'));
      return;
    }

    const cnpjLimpo = cnpjValue.replace(/\D/g, '');
    const cpfLimpo = cpfValue.replace(/\D/g, '');
    const emailLoginFinal = (emailLogin || formData.email).trim();
    const emailCorpFinal = emailCorporativo.trim();
    const bypass =
      isTestBypass
      || matchesCompanyTestBypass({
        email: session?.user?.email || emailLoginFinal,
        userName: formData.responsavelNome || session?.user?.name,
        companyName: formData.nome,
      });

    if (!usuarioLogado) {
      if (!emailLoginFinal) {
        setErrorMessage(t("registration.ui.informe-o-e-mail-pessoal-de-login"));
        return;
      }
      if (!emailCorpFinal) {
        setErrorMessage(t("registration.ui.informe-o-e-mail-corporativo-da-empresa"));
        return;
      }
    }

    if (!isEditMode && (!termos.autorizoDados || !termos.declaroVerdadeiro || !termos.aceitoLGPD)) {
      setErrorMessage(t("registration.ui.aceite-os-tres-termos-no-final-do-cadastro-para-continuar"));
      return;
    }

    setLoading(true);
    if (isEditMode) setSalvoNoBotao(false);

    try {
      if (bypass && usuarioLogado) {
        // Conta de teste: salva o que houver (logo/foto) e vai ao painel
        await fetch('/api/company/update-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            nome: formData.nome.trim(),
            responsavelNome: formData.responsavelNome.trim(),
            cnpj: cnpjLimpo,
            responsavelCpf: cpfLimpo,
            telefone: telefoneValue.trim(),
            endereco: formData.endereco.trim(),
            emailCorporativo: emailCorpFinal,
            cartaoCnpjUrl,
            logoUrl,
            fotoResponsavelUrl,
          }),
        }).catch(() => undefined);
        if (isEditMode) {
          setSalvoNoBotao(true);
          setEditandoEmpresa(false);
          setEditandoResponsavel(false);
          setLoading(false);
          return;
        }
        router.push('/company/dashboard-empresa');
        return;
      }

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
            telefone: telefoneValue.trim(),
            endereco: formData.endereco.trim(),
            emailCorporativo: emailCorpFinal,
            cartaoCnpjUrl,
            logoUrl,
            fotoResponsavelUrl,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErrorMessage(data?.error || t("registration.ui.erro-ao-finalizar-cadastro"));
          setLoading(false);
          return;
        }

        if (isEditMode) {
          setSuccessMessage(t("registration.ui.alteracoes-salvas"));
          setSalvoNoBotao(true);
          setEditandoEmpresa(false);
          setEditandoResponsavel(false);
          setLoading(false);
          return;
        }
        setSuccessMessage(t("registration.ui.cadastro-salvo"));
        router.push('/company/boas-vindas');
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'company',
          countryCode: pais,
          email: emailLoginFinal,
          emailCorporativo: emailCorpFinal,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          name: formData.nome.trim(),
          responsavelNome: formData.responsavelNome.trim(),
          responsavelCpf: cpfLimpo,
          cnpj: cnpjLimpo,
          telefone: telefoneValue.trim(),
          endereco: formData.endereco.trim(),
          cartaoCnpjUrl,
          logoUrl,
          fotoResponsavelUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail = data?.feedback?.length ? ` ${data.feedback.join(' ')}` : '';
        setErrorMessage((data?.error || t("registration.ui.erro-ao-finalizar-cadastro")) + detail);
        setLoading(false);
        return;
      }

      setSuccessMessage(t("registration.ui.cadastro-salvo-enviamos-um-e-mail-para-confirmar-o-endereco-corp"));
      void fetch('/api/company/send-corporate-email-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailCorpFinal }),
      }).catch(() => undefined);
      router.push('/company/boas-vindas');
    } catch (err) {
      console.error('Erro no cadastro empresa:', err);
      setErrorMessage(t("registration.ui.erro-de-rede-ao-finalizar-cadastro-tente-novamente"));
      setLoading(false);
    }
  };

  if (
    !incorporado && (
      (status === 'loading' && !sessionWaitTimedOut) ||
      (status === 'authenticated' && checkingRegistration)
    )
  ) {
    return (
      <PageLoader
        message={checkingRegistration ? t("registration.ui.verificando-cadastro") : t("registration.ui.carregando")}
      />
    );
  }

  if (contaProfissional && session?.user) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#F3E6C8', padding: '40px 20px', color: '#414141', overflow: 'hidden', ...READABLE_TEXT_STYLE }} className="ri-readable">
        <AuthAtmosphere intensity="strong" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '560px', margin: '0 auto', background: '#E8D5A3', padding: '40px', borderRadius: '16px', border: '1px solid rgba(200,155,60,0.7)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <h1 style={{ color: '#C89B3C', marginTop: 0 }}>{t("registration.ui.conta-profissional-detectada")}</h1>
          <p style={{ lineHeight: 1.6 }}>
            {t("registration.ui.o-email")} <strong>{session.user.email}</strong> {t("registration.ui.ja-esta-cadastrado-como")} <strong>{t("registration.ui.profissional")}</strong>
            {session.user.name ? ` (${session.user.name})` : ''}.
          </p>
          <p style={{ lineHeight: 1.6, color: 'var(--dash-text, #414141)' }}>
            {t("registration.ui.para-acessar-como-empresa")}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <button
              type="button"
              onClick={() => router.push('/professional/dashboard')}
              style={{ padding: '12px', background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t("registration.ui.ir-ao-painel-profissional")}
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/api/auth/logout'; }}
              style={{ padding: '12px', background: 'transparent', color: '#414141', border: '2px solid #8D6B1F', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t("registration.ui.sair-e-usar-outro-email")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isEditMode && contaJaCompleta) {
    const emailLogado = session?.user?.email || t("registration.ui.sua-conta");
    return (
      <div className={`${styles.container} ri-readable`}>
        <AuthAtmosphere intensity="strong" />
        <div className={styles.card} role="main" aria-labelledby="register-title">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <LogoRecruta size="sm" as="div" depth />
          </div>
          <h1 id="register-title" className={styles.title}>
            {t("registration.ui.voce-ja-tem-cadastro")}
          </h1>
          <p className={styles.formHint}>
            {t("registration.ui.voce-ja-esta-logado")} <strong>{emailLogado}</strong>.{" "}
            {t("registration.ui.para-entrar-no-painel")}
          </p>
          <div className={styles.alreadyRegisteredActions}>
            <Link href="/company/dashboard-empresa" className={styles.submitBtn}>
              {t("registration.ui.ir-ao-painel")}
            </Link>
            <button
              type="button"
              className={styles.secondaryLinkBtn}
              onClick={() => {
                void signOut({ callbackUrl: '/company/register' });
              }}
            >
              {t("registration.ui.sair-e-criar-outro-cadastro")}
            </button>
            <Link href="/" className={styles.secondaryLinkBtn}>
              {t("registration.ui.voltar-a-pagina-inicial")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rotuloStatus = rotuloVerificacao(statusVerificacao);
  const corStatus = rotuloStatus === t("registration.ui.aprovado")
    ? { background: '#1a3d1a', color: '#9ae6b4' }
    : rotuloStatus === t("registration.ui.reprovado")
      ? { background: '#3d1a1a', color: '#f87171' }
      : { background: '#E8C56A', color: '#24180a' };
  const empresaTravada = isEditMode && !editandoEmpresa;
  const responsavelTravado = isEditMode && !editandoResponsavel;

  return (
    <div className={`${styles.container} ${styles.containerIncorporado} ri-readable`}>
      {incorporado ? null : <AuthAtmosphere intensity="strong" />}
      {loading && !isEditMode && <PageLoader message={t("registration.ui.enviando-cadastro")} mode="overlay" />}
      <div className={styles.card} style={{ maxWidth: 1100 }}>
        {isEditMode ? (
          <>
            <div className={layout.topoPerfil}>
              <button type="button" className={styles.anexoBtn} onClick={voltarAoPainel}>
                {t("registration.ui.voltar")}
              </button>
              <div className={layout.topoPerfilAcoes}>
                <span
                  className={layout.statusConta}
                  style={{ background: corStatus.background, color: corStatus.color }}
                >
                  {rotuloStatus}
                </span>
                <DeleteAccountControl variant="compact" />
              </div>
            </div>
            {rotuloStatus === t("registration.ui.reprovado") && motivoReprovacao.trim() ? (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#3d1a1a', lineHeight: 1.45, textAlign: 'right' }}>
                <strong>{t("registration.ui.justificativa")} </strong>
                {motivoReprovacao.trim()}
              </p>
            ) : null}
          </>
        ) : null}
        {incorporado ? null : (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <LogoRecruta size="sm" as="div" depth />
          </div>
        )}
        {isEditMode ? null : (
          <h1 className={styles.title}>{t("registration.ui.cadastro-empresa-2")}</h1>
        )}

        {isTestBypass && (
          <div style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 8,
            border: '2px solid #8D6B1F',
            background: 'rgba(200,155,60,0.12)',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 10px', color: '#414141', fontSize: 13, lineHeight: 1.45 }}>
              {t("registration.ui.conta-de-teste")} <strong>{t("registration.ui.paizaonacozinha")}</strong>{t("registration.ui.preenchimento-opcional")}
            </p>
            <button
              type="button"
              className={styles.anexoBtn}
              onClick={() => router.push('/company/dashboard-empresa')}
            >
              {t("registration.ui.ir-ao-painel-sem-preencher")}
            </button>
          </div>
        )}

        {usuarioLogado && !isEditMode && (
          <p style={{ color: '#414141', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
            {t("registration.ui.voce-entrou-com-google")}
          </p>
        )}

        <div className={styles.brandLockup}>
          <div className={styles.brandCircles} aria-hidden={!logoUrl && !fotoResponsavelUrl}>
            <div className={`${styles.logoCircle}${logoUrl ? ` ${styles.logoCircleFilled}` : ''}`}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={t("registration.ui.logotipo-da-empresa")} />
              ) : (
                <span className={styles.circlePlaceholder}>{t("registration.ui.logo")}<br />{t("registration.ui.empresa")}</span>
              )}
            </div>
            <div className={styles.fotoCircle}>
              {fotoResponsavelUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoResponsavelUrl} alt={t("registration.ui.foto-do-responsavel")} />
              ) : (
                <span className={styles.circlePlaceholder}>{t("registration.ui.foto")}</span>
              )}
            </div>
          </div>

          <div className={styles.brandActions}>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={(e) => void handleLogoUpload(e)}
            />
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={(e) => void handleFotoResponsavelUpload(e)}
            />
            <button
              type="button"
              className={styles.anexoBtn}
              onClick={() => logoInputRef.current?.click()}
              disabled={enviandoLogo}
            >
              {enviandoLogo ? t("registration.ui.enviando") : logoUrl ? t("registration.ui.trocar-logotipo") : t("registration.ui.enviar-logotipo")}
            </button>
            <button
              type="button"
              className={styles.anexoBtn}
              onClick={() => fotoInputRef.current?.click()}
              disabled={enviandoFoto}
            >
              {enviandoFoto ? t("registration.ui.enviando") : fotoResponsavelUrl ? t("registration.ui.trocar-foto") : t("registration.ui.foto-do-responsavel")}
            </button>
          </div>
          <p className={styles.brandHint}>
            {t("registration.ui.opcional-logotipo")}
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {errorMessage && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}>
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div style={{ background: '#F3E6C8', color: '#414141', padding: '10px', borderRadius: '8px', fontWeight: 'bold', border: '2px solid #8D6B1F' }}>
              {successMessage}
            </div>
          )}

          <section className={styles.sectionCard}>
            <div className={styles.sectionHead}>
              <RegisterSectionHeader emoji="🏭" title={t("registration.ui.dados-da-empresa")} />
              {isEditMode ? (
                <button
                  type="button"
                  className={styles.blocoEditarBtn}
                  disabled={loading}
                  onClick={(event) => {
                    if (!editandoEmpresa) {
                      setEditandoEmpresa(true);
                      return;
                    }
                    event.currentTarget.form?.requestSubmit();
                  }}
                >
                  {editandoEmpresa ? (loading ? t("registration.ui.salvando") : t("registration.ui.salvar")) : t("registration.ui.editar")}
                </button>
              ) : null}
            </div>
            <div inert={empresaTravada ? true : undefined} className={empresaTravada ? styles.cadastroTravado : undefined}>
              <div className={layout.linhaCheia}>
                <RegistrationCountryField
                  id="empresa-pais"
                  value={pais}
                  onChange={setPais}
                  disabled={usuarioLogado || isEditMode}
                  labelClassName={styles.label}
                  selectClassName={styles.input}
                  hintClassName={styles.formHint}
                />
              </div>
              <div className={layout.linhaTripla}>
                <div>
                  <label className={styles.label}>{t("registration.ui.cnpj")}</label>
                  <input id="empresa-cnpj" type="text" className={styles.input} placeholder="00.000.000/0000-00" value={cnpjValue} onChange={handleCnpjChange} disabled={!usuarioLogado && !isEditMode && pais !== 'BR'} />
                </div>
                <div>
                  <label className={styles.label}>{t("registration.ui.razao-social")}</label>
                  <input id="empresa-razao" type="text" className={styles.input} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                </div>
                <div>
                  <label className={styles.label}>{t("registration.ui.telefone-ddd")}</label>
                  <input
                    id="empresa-telefone"
                    type="tel"
                    className={styles.input}
                    placeholder="(00) 00000-0000"
                    value={telefoneValue}
                    onChange={(e) => setTelefoneValue(formatarTelefone(e.target.value))}
                    required={false}
                    disabled={!usuarioLogado && !isEditMode && pais !== 'BR'}
                  />
                </div>
              </div>
              <div className={layout.linhaCheia}>
                <label className={styles.label}>{t("registration.ui.endereco")}</label>
                <input
                  id="empresa-endereco"
                  type="text"
                  className={styles.input}
                  placeholder={t("registration.ui.rua-numero-bairro-cidade-uf")}
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>
              <p className={layout.avisoDesbloqueio}>
                {t("registration.ui.aviso-desbloqueio")}
              </p>
              <div className={layout.linhaDupla}>
                <div>
                  <label className={styles.label}>
                    {emailVerificado ? (
                      <span aria-label={t("registration.ui.e-mail-verificado")} style={{ color: "#1b7a32", marginRight: 6 }}>✓</span>
                    ) : null}
                    {t("registration.ui.email-corporativo-label")}
                  </label>
                  <div className={styles.anexoCampoInline}>
                    <div className={styles.anexoCampoInput}>
                      <input
                        id="empresa-email"
                        type="email"
                        placeholder="contato@suaempresa.com.br"
                        value={emailCorporativo}
                        onChange={(e) => atualizarEmailCorporativo(e.target.value)}
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          color: '#414141',
                          fontSize: 14,
                          lineHeight: 1.4,
                          padding: 0,
                          minWidth: 0,
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.anexoCampoBtn}
                      onClick={() => void handleEnviarConfirmacaoEmail()}
                      disabled={enviandoEmail || emailVerificado || empresaTravada}
                      style={{
                        background: emailVerificado ? '#1a3d1a' : undefined,
                        color: emailVerificado ? '#9ae6b4' : undefined,
                        borderLeft: emailVerificado ? '1px solid #2f855a' : undefined,
                        cursor: enviandoEmail || emailVerificado || empresaTravada ? 'not-allowed' : 'pointer',
                        opacity: enviandoEmail ? 0.7 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {enviandoEmail
                        ? t("registration.ui.enviando")
                        : emailVerificado
                          ? t("registration.ui.confirmado")
                          : emailEnviado
                            ? t("registration.ui.reenviar")
                            : t("registration.ui.confirmar")}
                    </button>
                  </div>
                  {emailMensagem && (
                    <div style={{ marginTop: 10, background: '#F3E6C8', color: '#414141', padding: 10, borderRadius: 8, border: '2px solid #8D6B1F', fontSize: 13, lineHeight: 1.5 }}>
                      {emailMensagem}
                    </div>
                  )}
                  {emailErro && <small style={{ color: '#dc3545', display: 'block', marginTop: 8 }}>{emailErro}</small>}
                </div>
                <div>
                  <label className={styles.label}>{t("registration.ui.cartao-cnpj")}</label>
                  <div className={styles.anexoCampoInline}>
                    <div className={styles.anexoCampoInput}>
                      {cartaoCnpjNome ? (
                        <span className={styles.anexoCampoNome}>{cartaoCnpjNome}</span>
                      ) : (
                        <span className={styles.anexoCampoPlaceholder}>{t("registration.ui.nenhum-arquivo-selecionado")}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.anexoCampoBtn}
                      onClick={() => cartaoInputRef.current?.click()}
                      disabled={enviandoCartao || empresaTravada}
                    >
                      {enviandoCartao ? t("registration.ui.enviando") : cartaoCnpjUrl ? t("registration.ui.trocar") : t("registration.ui.selecionar")}
                    </button>
                  </div>
                  <input
                    ref={cartaoInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    style={{ display: 'none' }}
                    onChange={(e) => void handleCartaoCnpjUpload(e)}
                  />
                  {cartaoCnpjUrl && !enviandoCartao && (
                    <small style={{ color: '#C89B3C', display: 'block', marginTop: 6 }}>
                      ✓ Arquivo enviado{' '}
                      <a href={cartaoCnpjUrl} target="_blank" rel="noreferrer" style={{ color: '#414141' }}>{t("registration.ui.ver-arquivo")}</a>
                    </small>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHead}>
              <RegisterSectionHeader emoji="👤" title={t("registration.ui.dados-do-responsavel")} />
              {isEditMode ? (
                <button
                  type="button"
                  className={styles.blocoEditarBtn}
                  disabled={loading}
                  onClick={(event) => {
                    if (!editandoResponsavel) {
                      setEditandoResponsavel(true);
                      return;
                    }
                    event.currentTarget.form?.requestSubmit();
                  }}
                >
                  {editandoResponsavel ? (loading ? t("registration.ui.salvando") : t("registration.ui.salvar")) : t("registration.ui.editar")}
                </button>
              ) : null}
            </div>
            <div inert={responsavelTravado ? true : undefined} className={responsavelTravado ? styles.cadastroTravado : undefined}>
              <div className={layout.linhaResponsavel}>
                <div>
                  <label className={styles.label}>{t("registration.ui.nome-do-responsavel")}</label>
                  <input
                    id="empresa-responsavel"
                    type="text"
                    className={styles.input}
                    placeholder={t("registration.ui.pessoa-que-utiliza-a-plataforma")}
                    value={formData.responsavelNome}
                    onChange={(e) => setFormData({ ...formData, responsavelNome: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.label}>{t("registration.ui.cpf-do-responsavel")}</label>
                  <input
                    id="empresa-cpf"
                    type="text"
                    className={styles.input}
                    placeholder="000.000.000-00"
                    value={cpfValue}
                    onChange={handleCpfChange}
                    disabled={!usuarioLogado && !isEditMode && pais !== 'BR'}
                    style={{ borderColor: cpfError ? '#dc3545' : cpfValidado ? '#C89B3C' : undefined }}
                  />
                  {cpfError && <small style={{ color: '#dc3545' }}>{cpfError}</small>}
                  {cpfValidado && !cpfError && <small style={{ color: '#C89B3C' }}>{t("registration.ui.cpf-valido")}</small>}
                </div>
                <div>
                  <label className={styles.label}>{t("registration.ui.e-mail-de-login")}</label>
                  {usuarioLogado ? (
                    <input id="empresa-email-login" type="email" className={styles.input} value={emailLogin || formData.email} style={{ opacity: 0.75 }} readOnly disabled />
                  ) : (
                    <input
                      id="empresa-email-login"
                      type="email"
                      className={styles.input}
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setFormData({ ...formData, email: valor });
                        setIsTestBypass(matchesCompanyTestBypass({ email: valor }));
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {!usuarioLogado && !isEditMode ? (
            <section className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <RegisterSectionHeader emoji="🔐" title={t("registration.ui.senha-de-acesso")} />
              </div>
              <div className={styles.fieldsRow} style={twoCols}>
                <div>
                  <label className={styles.label}>{t("registration.ui.senha")}</label>
                  <input id="empresa-senha" type="password" className={styles.input} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  {!isTestBypass && (
                    <small style={{ color: '#414141' }}>{t("registration.ui.minimo-8-caracteres-com-letras-maiusculas-minusculas-numeros-e-s")}</small>
                  )}
                </div>
                <div>
                  <label className={styles.label}>{t("registration.ui.confirmar-senha")}</label>
                  <input id="empresa-senha-confirma" type="password" className={styles.input} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                </div>
              </div>
            </section>
          ) : null}

          <div className={layout.rodapeCadastro}>
            <section className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <RegisterSectionHeader emoji="📋" title={t("registration.ui.termos")} />
              </div>
              <div className={styles.formSubCard}>
                <RegisterTermoItem
                  id="empresa-termo-dados"
                  slug="autorizacao-dados"
                  titulo={t("registration.ui.termo-de-autorizacao-de-uso-de-dados")}
                  checked={termos.autorizoDados}
                  onChange={(checked) => setTermos((prev) => ({ ...prev, autorizoDados: checked }))}
                />
                <RegisterTermoItem
                  id="empresa-termo-veracidade"
                  slug="declaracao-veracidade"
                  titulo={t("registration.ui.termo-de-declaracao-de-veracidade")}
                  checked={termos.declaroVerdadeiro}
                  onChange={(checked) => setTermos((prev) => ({ ...prev, declaroVerdadeiro: checked }))}
                />
                <RegisterTermoItem
                  id="empresa-termo-lgpd"
                  slug="lgpd"
                  titulo={t("registration.ui.termo-lgpd-tratamento-de-dados-pessoais")}
                  checked={termos.aceitoLGPD}
                  onChange={(checked) => setTermos((prev) => ({ ...prev, aceitoLGPD: checked }))}
                />
              </div>
              {isEditMode ? null : (
                <>
                  <div className={styles.submitBtnRow}>
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loading}
                      style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? t("registration.ui.salvando") : t("registration.ui.finalizar-cadastro")}
                    </button>
                  </div>
                  <div className={styles.anexoBtnRow}>
                    <Link href="/login?tipo=empresa" style={{ fontSize: '13px', color: '#414141', textDecoration: 'underline' }}>
                      {t("registration.ui.ja-tem-conta")}
                    </Link>
                  </div>
                </>
              )}
            </section>
            <div className={layout.porqueVerificacao}>
              <p className={layout.porqueTitulo}>{t("registration.ui.por-que-pedimos-essas-verificacoes")}</p>
              <p className={layout.porqueTexto}>
                {t("registration.ui.porque-verificacao")}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
export default function CadastroEmpresa({ incorporado = false }: { incorporado?: boolean } = {}) {
  return (
    <Suspense fallback={<PageLoader message={t("registration.ui.carregando")} />}>
      <CadastroEmpresaContent incorporado={incorporado} />
    </Suspense>
  );
}