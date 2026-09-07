"use client";

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isValidCPF, isValidPhoneBR } from '@/lib/security';
import PageLoader from '@/app/components/PageLoader';
import { READABLE_TEXT_STYLE } from '@/lib/theme';
import styles from '@/app/professional/register/register.module.css';
import { matchesCompanyTestBypass } from '@/lib/company/company-test-bypass-shared';

const twoCols = { '--fields-per-row': '2' } as React.CSSProperties;

function CadastroEmpresaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    nome: '',
    responsavelNome: '',
    email: '',
    password: '',
    confirmPassword: '',
    endereco: '',
  });

  const [telefoneValue, setTelefoneValue] = useState('');

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
      if (!usuarioLogado) {
        setFormData((prev) => ({ ...prev, email: emailFromUrl }));
      }
    }

    if (verificado && emailFromUrl) {
      setEmailVerificado(true);
      setEmailEnviado(true);
      setEmailMensagem('E-mail corporativo confirmado com sucesso. Você pode continuar o cadastro.');
      setEmailErro('');
    }
  }, [searchParams, usuarioLogado]);

  useEffect(() => {
    if (!emailEnviado || emailVerificado || !emailCorporativo.trim()) return;

    const interval = window.setInterval(() => {
      void fetch(`/api/company/corporate-email-status?email=${encodeURIComponent(emailCorporativo.trim())}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.verified) {
            setEmailVerificado(true);
            setEmailMensagem('E-mail corporativo confirmado com sucesso. Você pode continuar o cadastro.');
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
      return;
    }

    if (status !== 'authenticated' || !session?.user) return;

    const email = session.user.email || '';
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

    setCheckingRegistration(true);
    let redirecting = false;
    const user = session.user;
    void fetch('/api/company/check-registration', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const testBypass = data?.testBypass === true || bypassByEmail;
        setIsTestBypass(testBypass);

        if ((data?.registrationComplete || testBypass) && !isEditMode) {
          redirecting = true;
          router.replace('/company/dashboard-empresa');
          return;
        }

        setUsuarioLogado(true);
        const userData = data?.user;
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
            setEmailMensagem('E-mail corporativo já confirmado.');
          }
        }

        if (userData?.cartaoCnpjUrl) {
          setCartaoCnpjUrl(String(userData.cartaoCnpjUrl));
          setCartaoCnpjNome('Cartão CNPJ enviado');
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
        if (bypassByEmail) {
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
      .finally(() => {
        if (!redirecting) setCheckingRegistration(false);
      });
  }, [status, session, router, isEditMode]);

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
    if (!usuarioLogado) {
      setFormData((prev) => ({ ...prev, email: valor }));
      setIsTestBypass(matchesCompanyTestBypass({ email: valor }));
    }
  };

  const handleEnviarConfirmacaoEmail = async () => {
    const email = emailCorporativo.trim();
    if (!email) {
      setEmailErro('Informe o e-mail corporativo da empresa.');
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
        setEmailErro(data?.error || 'Não foi possível enviar o e-mail de confirmação.');
        return;
      }

      setEmailEnviado(true);
      setEmailMensagem(
        data?.message
        || `Enviamos um e-mail de confirmação para ${email}. Acesse o link no e-mail para continuar o cadastro.`,
      );
    } catch {
      setEmailErro('Erro de rede ao enviar o e-mail de confirmação.');
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
        setErrorMessage(data?.error || 'Erro ao enviar o cartão CNPJ.');
        return;
      }

      setCartaoCnpjUrl(data.file.url);
      setCartaoCnpjNome(data.file.name || file.name);
    } catch {
      setErrorMessage('Erro de rede ao enviar o cartão CNPJ.');
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
      setErrorMessage(data?.error || 'Erro ao enviar a imagem.');
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
      setErrorMessage('Envie uma imagem (JPG, PNG, WEBP ou GIF).');
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
      setErrorMessage('Erro de rede ao enviar o logotipo.');
    } finally {
      setEnviandoLogo(false);
      e.target.value = '';
    }
  };

  const handleFotoResponsavelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Envie uma imagem (JPG, PNG, WEBP ou GIF).');
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
      setErrorMessage('Erro de rede ao enviar a foto do responsável.');
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
    const bypass =
      isTestBypass
      || matchesCompanyTestBypass({
        email: session?.user?.email || emailLogin || formData.email,
        userName: formData.responsavelNome || session?.user?.name,
        companyName: formData.nome,
      });

    if (!bypass) {
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

      if (!formData.email.trim() && !usuarioLogado) {
        setErrorMessage('Informe o e-mail de acesso da conta.');
        return;
      }

      if (!telefoneValue.trim()) {
        setErrorMessage('Informe o telefone da empresa.');
        return;
      }

      if (!isValidPhoneBR(telefoneValue)) {
        setErrorMessage('Informe um telefone válido com DDD.');
        return;
      }

      if (!formData.endereco.trim() || formData.endereco.trim().length < 5) {
        setErrorMessage('Informe o endereço da empresa.');
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
    }

    const emailCorpFinal = (usuarioLogado ? emailCorporativo : formData.email).trim();

    setLoading(true);

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
          setErrorMessage(data?.error || 'Erro ao finalizar cadastro.');
          setLoading(false);
          return;
        }

        setSuccessMessage(
          isEditMode
            ? 'Cadastro atualizado com sucesso! Redirecionando...'
            : 'Cadastro salvo! Você já pode usar a vitrine. Contatos e dados sensíveis liberam após confirmar o e-mail corporativo e aprovação do cartão CNPJ.',
        );
        router.push(isEditMode ? '/company/dashboard-empresa' : '/company/boas-vindas');
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'company',
          email: emailCorpFinal,
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
        setErrorMessage((data?.error || 'Erro ao finalizar cadastro.') + detail);
        setLoading(false);
        return;
      }

      setSuccessMessage('Cadastro finalizado com sucesso! Redirecionando...');
      router.push('/company/boas-vindas');
    } catch (err) {
      console.error('Erro no cadastro empresa:', err);
      setErrorMessage('Erro de rede ao finalizar cadastro. Tente novamente.');
      setLoading(false);
    }
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
      <div style={{ minHeight: '100vh', backgroundColor: '#3A3A3A', padding: '40px 20px', color: '#F2F2F2', ...READABLE_TEXT_STYLE }} className="ri-readable">
        <div style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#2B2B2B', padding: '40px', borderRadius: '15px', border: '1px solid #8D6B1F', textAlign: 'center' }}>
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
    <div className={`${styles.container} ri-readable`}>
      {loading && <PageLoader message="Enviando cadastro..." mode="overlay" />}
      <div className={styles.card} style={{ maxWidth: 1100 }}>
        <h1 className={styles.title}>
          {isEditMode ? 'ATUALIZAR CADASTRO' : 'CADASTRO EMPRESA'}
        </h1>

        {isTestBypass && (
          <div style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid #8D6B1F',
            background: 'rgba(200,155,60,0.12)',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 10px', color: '#F2F2F2', fontSize: 13, lineHeight: 1.45 }}>
              Conta de teste <strong>paizaonacozinha</strong>: preenchimento opcional.
            </p>
            <button
              type="button"
              className={styles.anexoBtn}
              onClick={() => router.push('/company/dashboard-empresa')}
            >
              Ir ao painel sem preencher
            </button>
          </div>
        )}

        {isEditMode && (
          <p style={{ color: '#ccc', fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>
            Atualize os dados da sua empresa. As alterações aparecerão no painel após salvar.
          </p>
        )}

        {usuarioLogado && !isEditMode && (
          <p style={{ color: '#F2F2F2', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
            Você entrou com Google. Complete os dados da empresa abaixo — não é necessário criar senha.
          </p>
        )}

        <div className={styles.brandLockup}>
          <div className={styles.brandCircles} aria-hidden={!logoUrl && !fotoResponsavelUrl}>
            <div className={`${styles.logoCircle}${logoUrl ? ` ${styles.logoCircleFilled}` : ''}`}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logotipo da empresa" />
              ) : (
                <span className={styles.circlePlaceholder}>Logo<br />empresa</span>
              )}
            </div>
            <div className={styles.fotoCircle}>
              {fotoResponsavelUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoResponsavelUrl} alt="Foto do responsável" />
              ) : (
                <span className={styles.circlePlaceholder}>Foto</span>
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
              {enviandoLogo ? 'Enviando...' : logoUrl ? 'Trocar logotipo' : 'Enviar logotipo'}
            </button>
            <button
              type="button"
              className={styles.anexoBtn}
              onClick={() => fotoInputRef.current?.click()}
              disabled={enviandoFoto}
            >
              {enviandoFoto ? 'Enviando...' : fotoResponsavelUrl ? 'Trocar foto' : 'Foto do responsável'}
            </button>
          </div>
          <p className={styles.brandHint}>
            Opcional: logotipo da empresa (círculo maior) e foto da pessoa responsável (círculo menor entrando no logo).
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
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

          <div className={styles.fieldsRow} style={twoCols}>
            <div>
              <label className={styles.label}>CNPJ {isTestBypass ? '' : '*'}</label>
              <input type="text" className={styles.input} placeholder="00.000.000/0000-00" value={cnpjValue} onChange={handleCnpjChange} required={!isTestBypass} />
            </div>

            <div>
              <label className={styles.label}>RAZÃO SOCIAL {isTestBypass ? '' : '*'}</label>
              <input type="text" className={styles.input} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required={!isTestBypass} />
            </div>

            <div>
              <label className={styles.label}>NOME DO RESPONSÁVEL {isTestBypass ? '' : '*'}</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Pessoa que utiliza a plataforma"
                value={formData.responsavelNome}
                onChange={(e) => setFormData({ ...formData, responsavelNome: e.target.value })}
                required={!isTestBypass}
              />
            </div>

            <div>
              <label className={styles.label}>CPF DO RESPONSÁVEL {isTestBypass ? '' : '*'}</label>
              <input
                type="text"
                className={styles.input}
                placeholder="000.000.000-00"
                value={cpfValue}
                onChange={handleCpfChange}
                style={{ borderColor: cpfError ? '#dc3545' : cpfValidado ? '#C89B3C' : undefined }}
                required={!isTestBypass}
              />
              {cpfError && <small style={{ color: '#dc3545' }}>{cpfError}</small>}
              {cpfValidado && !cpfError && <small style={{ color: '#C89B3C' }}>✓ CPF válido</small>}
            </div>

            {usuarioLogado ? (
              <div>
                <label className={styles.label}>E-MAIL DE LOGIN</label>
                <input type="email" className={styles.input} value={emailLogin || formData.email} style={{ opacity: 0.75 }} readOnly disabled />
                <small style={{ color: '#ccc' }}>E-mail usado para entrar na plataforma.</small>
              </div>
            ) : null}

            <div>
              <label className={styles.label}>
                E-MAIL CORPORATIVO {usuarioLogado ? '(opcional)' : '*'}
              </label>
              <div className={styles.anexoCampoInline}>
                <div className={styles.anexoCampoInput}>
                  <input
                    type="email"
                    placeholder="contato@suaempresa.com.br"
                    value={usuarioLogado ? emailCorporativo : formData.email}
                    onChange={(e) => atualizarEmailCorporativo(e.target.value)}
                    required={!usuarioLogado && !isTestBypass}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: '#f2f2f2',
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
                  disabled={enviandoEmail || emailVerificado}
                  style={{
                    background: emailVerificado ? '#1a3d1a' : undefined,
                    color: emailVerificado ? '#9ae6b4' : undefined,
                    borderLeft: emailVerificado ? '1px solid #2f855a' : undefined,
                    cursor: enviandoEmail || emailVerificado ? 'not-allowed' : 'pointer',
                    opacity: enviandoEmail ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {enviandoEmail
                    ? 'Enviando...'
                    : emailVerificado
                      ? 'Confirmado'
                      : emailEnviado
                        ? 'Reenviar'
                        : 'Confirmar'}
                </button>
              </div>
              <small style={{ color: '#ccc', display: 'block', marginTop: 6 }}>
                {usuarioLogado
                  ? 'Opcional no cadastro. Contatos só liberam após confirmar este e-mail.'
                  : 'E-mail de acesso da conta. Para liberar contatos, confirme também um e-mail corporativo.'}
              </small>
              {emailMensagem && (
                <div style={{ marginTop: 10, background: '#1a1508', color: '#F2F2F2', padding: 10, borderRadius: 8, border: '1px solid #8D6B1F', fontSize: 13, lineHeight: 1.5 }}>
                  {emailMensagem}
                </div>
              )}
              {emailErro && <small style={{ color: '#dc3545', display: 'block', marginTop: 8 }}>{emailErro}</small>}
              {emailVerificado && !emailErro && (
                <small style={{ color: '#C89B3C', display: 'block', marginTop: 8 }}>✓ E-mail corporativo confirmado</small>
              )}
            </div>

            {!usuarioLogado ? (
              <div>
                <label className={styles.label}>TELEFONE (DDD) {isTestBypass ? '' : '*'}</label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="(00) 00000-0000"
                  value={telefoneValue}
                  onChange={(e) => setTelefoneValue(formatarTelefone(e.target.value))}
                  required={!isTestBypass}
                />
              </div>
            ) : null}

            {usuarioLogado ? (
              <div>
                <label className={styles.label}>TELEFONE (DDD) {isTestBypass ? '' : '*'}</label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="(00) 00000-0000"
                  value={telefoneValue}
                  onChange={(e) => setTelefoneValue(formatarTelefone(e.target.value))}
                  required={!isTestBypass}
                />
              </div>
            ) : null}

            <div>
              <label className={styles.label}>ENDEREÇO {isTestBypass ? '' : '*'}</label>
              <textarea
                className={styles.input}
                placeholder="Rua, número, bairro, cidade — UF"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                style={{ minHeight: 88, resize: 'vertical' }}
                required={!isTestBypass}
              />
            </div>

            <div>
              <label className={styles.label}>CARTÃO CNPJ (opcional)</label>
              <div className={styles.anexoCampoInline}>
                <div className={styles.anexoCampoInput}>
                  {cartaoCnpjNome ? (
                    <span className={styles.anexoCampoNome}>{cartaoCnpjNome}</span>
                  ) : (
                    <span className={styles.anexoCampoPlaceholder}>Nenhum arquivo selecionado</span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.anexoCampoBtn}
                  onClick={() => cartaoInputRef.current?.click()}
                  disabled={enviandoCartao}
                >
                  {enviandoCartao ? 'Enviando...' : cartaoCnpjUrl ? 'Trocar' : 'Selecionar'}
                </button>
              </div>
              <input
                ref={cartaoInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                onChange={(e) => void handleCartaoCnpjUpload(e)}
              />
              <small style={{ color: '#ccc', display: 'block', marginTop: 6 }}>
                Opcional no cadastro. Contatos só liberam após enviar e o admin aprovar o cartão CNPJ.
              </small>
              {cartaoCnpjUrl && !enviandoCartao && (
                <small style={{ color: '#C89B3C', display: 'block', marginTop: 6 }}>
                  ✓ Arquivo enviado{' '}
                  <a href={cartaoCnpjUrl} target="_blank" rel="noreferrer" style={{ color: '#F2F2F2' }}>ver arquivo</a>
                </small>
              )}
            </div>

            {!usuarioLogado && (
              <>
                <div>
                  <label className={styles.label}>SENHA {isTestBypass ? '' : '*'}</label>
                  <input type="password" className={styles.input} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!isTestBypass} minLength={isTestBypass ? undefined : 8} />
                  {!isTestBypass && (
                    <small style={{ color: '#F2F2F2' }}>Mínimo 8 caracteres, com letras maiúsculas, minúsculas, números e símbolo.</small>
                  )}
                </div>
                <div>
                  <label className={styles.label}>CONFIRMAR SENHA {isTestBypass ? '' : '*'}</label>
                  <input type="password" className={styles.input} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required={!isTestBypass} minLength={isTestBypass ? undefined : 8} />
                </div>
              </>
            )}
          </div>

          <div className={styles.submitBtnRow}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Enviando...' : isEditMode ? 'ATUALIZAR CADASTRO' : 'FINALIZAR CADASTRO'}
            </button>
          </div>

          <div className={styles.anexoBtnRow}>
            {isEditMode ? (
              <button
                type="button"
                onClick={() => router.push('/company/dashboard-empresa')}
                style={{ fontSize: '13px', color: '#F2F2F2', background: 'transparent', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Voltar ao painel
              </button>
            ) : (
              <Link href="/login?tipo=empresa" style={{ fontSize: '13px', color: '#F2F2F2', textDecoration: 'underline' }}>
                Já tem conta? Entrar
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
export default function CadastroEmpresa() {
  return (
    <Suspense fallback={<PageLoader message="Carregando..." />}>
      <CadastroEmpresaContent />
    </Suspense>
  );
}