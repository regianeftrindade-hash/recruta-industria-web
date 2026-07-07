/**
 * 🔒 PÁGINA DE CADASTRO PROFISSIONAL - BLOQUEADA PARA ALTERAÇÕES
 * ============================================================
 * ⚠️ ATENÇÃO: Esta página foi finalizada e aprovada.
 * * RESTRIÇÕES:
 * ✗ NÃO alterar layout ou estrutura principal
 * ✗ NÃO remover campos obrigatórios
 * ✗ NÃO modificar validações críticas
 * ✗ NÃO alterar fluxo de cadastro
 * * ALTERAÇÕES PERMITIDAS:
 * ✓ Adicionar novos campos opcionais
 * ✓ Modificar mensagens de erro
 * ✓ Atualizar validações de segurança
 * ✓ Melhorar UX/UI mantendo layout
 * * Última atualização: 02/01/2026
 * Status: ✅ FINALIZADO E APROVADO
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { signIn, useSession, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './register.module.css';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { isValidEmail, isValidCPF, sanitizeInput } from '../../../lib/security';
import {
  buildFormEditForLoad,
} from '../../../lib/professional-profile-map';
import ProfileCompletionBar from '@/app/components/ProfileCompletionBar';
import RegisterSectionHeader from '@/app/components/RegisterSectionHeader';
import RegisterExtendedSections from './RegisterExtendedSections';
import PageLoader from '@/app/components/PageLoader';
import { calculateProfileCompletion, PREFIRO_NAO_INFORMAR, CNH_CATEGORIAS } from '@/lib/professional-form-config';
import { isArquivoAnexado, isArquivoNoServidor, nomeArquivoAnexado } from '@/lib/arquivo-anexo';

const BACKUP_STORAGE_KEY = 'dadosFormularioBackup';
const FORM_STORAGE_KEY = 'dadosFormularioCompleto';
const SIMPLE_STORAGE_KEY = 'dadosCadastroSimples';

function chavePorEmail(base: string, email: string): string {
  const slug = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `${base}__${slug}`;
}

function dadosPertencemAoUsuario(dados: Record<string, unknown>, email: string): boolean {
  const alvo = email.toLowerCase().trim();
  const owner = String(dados._ownerEmail || dados.email || '').toLowerCase().trim();
  return owner === alvo;
}

function emailsConferem(a?: string | null, b?: string | null): boolean {
  const ea = String(a || '').toLowerCase().trim();
  const eb = String(b || '').toLowerCase().trim();
  return !!ea && !!eb && ea === eb;
}

function limparBackupsGlobaisAntigos(): void {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
    localStorage.removeItem(BACKUP_STORAGE_KEY);
    localStorage.removeItem(SIMPLE_STORAGE_KEY);
  } catch {
    /* ignora */
  }
}

const CAMPOS_ARQUIVO_LOCAL = [
  'fotoPerfil',
  'curriculo',
  'atestado',
  'certificados',
  'cnhDocumento',
  'avatar',
] as const;

function valorPesadoParaStorage(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith('data:') || value.length > 400_000;
}

function sanitizarParaLocalStorage(dados: Record<string, unknown>): Record<string, unknown> {
  const limpo: Record<string, unknown> = { ...dados };

  for (const campo of CAMPOS_ARQUIVO_LOCAL) {
    const valor = limpo[campo];
    if (!valorPesadoParaStorage(valor)) continue;

    if (
      typeof valor === 'string'
      && (valor.startsWith('/uploads') || valor.startsWith('http://') || valor.startsWith('https://'))
    ) {
      limpo[campo] = valor;
    } else {
      delete limpo[campo];
    }
  }

  delete limpo.password;
  delete limpo.confirmPassword;

  return limpo;
}

function tentarSalvarLocal(key: string, payload: Record<string, unknown>): boolean {
  try {
    const json = JSON.stringify(payload);
    if (json.length > 4_000_000) return false;
    localStorage.setItem(key, json);
    return true;
  } catch {
    return false;
  }
}

function isFotoPerfilPreviewable(value: string | null): boolean {
  if (!value) return false;
  const src = String(value);
  return (
    src.startsWith('data:image') ||
    src.startsWith('/uploads') ||
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('blob:')
  );
}

function parseJsonSafe(res: Response): Promise<Record<string, unknown>> {
  return res.text().then((text) => {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error('Resposta inválida do servidor. Atualize a página e tente novamente.');
    }
  });
}

function CampoFotoPerfil({
  value,
  onFileSelect,
}: {
  value: string | null;
  onFileSelect: (file: File) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const temFoto = isFotoPerfilPreviewable(value);

  return (
    <div className={styles.fotoCampo}>
      <span className={styles.label}>Foto de perfil</span>
      {temFoto && (
        <div className={`${styles.anexoBox} ${styles.anexoRow}`}>
          <img
            src={String(value)}
            alt="Foto de perfil"
            className={styles.avatarPreview}
            decoding="async"
          />
          <div>
            <p className={styles.anexoTexto}>✓ Foto de perfil anexada</p>
            <button type="button" className={styles.anexoBtn} onClick={() => inputRef.current?.click()}>
              Trocar foto
            </button>
          </div>
        </div>
      )}
      {!temFoto && (
        <button
          type="button"
          className={styles.anexoBtn}
          style={{ marginBottom: 8 }}
          onClick={() => inputRef.current?.click()}
        >
          Selecionar foto
        </button>
      )}
      <input
        ref={inputRef}
        id="fotoPerfil"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            alert('Selecione um arquivo de imagem válido (JPG, PNG, etc.).');
            e.target.value = '';
            return;
          }
          await onFileSelect(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function CampoArquivoAnexo({
  id,
  label,
  accept,
  value,
  onFileSelect,
  textoBotaoVazio = 'Selecionar arquivo',
}: {
  id: string;
  label: string;
  accept: string;
  value: string | null;
  onFileSelect: (file: File) => Promise<void> | void;
  textoBotaoVazio?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const anexado = isArquivoAnexado(value);
  const noServidor = !!value && isArquivoNoServidor(value);

  return (
    <div>
      <span className={styles.label}>{label}</span>
      {anexado ? (
        <div className={styles.anexoBox}>
          <p className={styles.anexoTexto}>
            {noServidor ? '✓ Arquivo anexado:' : '⚠ Rascunho local (será enviado ao salvar):'}{' '}
            <strong>{nomeArquivoAnexado(value!)}</strong>
          </p>
          <div className={styles.anexoActions}>
            {noServidor && (
              <a
                href={value!}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={styles.anexoBtn}
              >
                Download
              </a>
            )}
            <button type="button" className={styles.anexoBtn} onClick={() => inputRef.current?.click()}>
              Trocar arquivo
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.anexoBtn} style={{ marginBottom: 8 }} onClick={() => inputRef.current?.click()}>
          {textoBotaoVazio}
        </button>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          await onFileSelect(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function CadastroProfissional() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const isEditMode = searchParams.get('edit') === '1';
  const [profileLoaded, setProfileLoaded] = useState(!isEditMode);
  const [checkingRegistration, setCheckingRegistration] = useState(!isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [cpf, setCpf] = useState('');
  const [senhaPreenchida, setSenhaPreenchida] = useState(false); // Rastreia se senha foi carregada do localStorage
  const [cpfError, setCpfError] = useState('');
  const [cpfValidating, setCpfValidating] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [telefone2, setTelefone2] = useState('');
  const [pretensaoSalarial, setPretensaoSalarial] = useState('');
  const [cursos, setCursos] = useState<string[]>(['']);
  const [certificacoes, setCertificacoes] = useState<string[]>(['']);
  const [idiomas, setIdiomas] = useState<string[]>(['']);
  const [dataNascimentoValue, setDataNascimentoValue] = useState('');
  const [empresas, setEmpresas] = useState<{ nome: string; cargo: string; dataInicio: string; dataFim: string }[]>([
    { nome: '', cargo: '', dataInicio: '', dataFim: '' }
  ]);

  const [formData, setFormData] = useState({
    nome: '', dataNascimento: '', idade: '', sexoBiologico: '', identidadeGenero: '', orientacaoSexual: '', estadoCivil: '', religiao: '', antecedentes: '',
    possuiFilhos: 'Não', quantidadeFilhos: '', faixaEtariaFilhos: [] as string[],
    email: '', telefone: '', telefone2: '', whatsapp: 'Não',
    estado: '', cidade: '', disponibilidadeMudanca: '',
    escolaridade: '', cursosCertificacoes: '',
    situacaoProfissional: '', areaInteresse: '', cargoDesejado: '', turnoDisponivel: '', disponibilidadeInicio: '',
    trabalhouIndustria: 'Não', tempoExperiencia: '', experiencias: '',
    recolocacao: '', pretensaoSalarial: '',
    segmentosIndustria: [] as string[],
    maquinasEquipamentos: [] as string[], qualidadeProcessos: [] as string[],
    informatica: [] as string[], possuiCNH: '', categoriaCNH: '',
    aceitaViagens: '', disponivelContratacao: '',
    certificados: null as string | null, cnhDocumento: null as string | null,
    fotoPerfil: null as string | null, curriculo: null as string | null, atestado: null as string | null,
    mensagemEmpresas: '',
    autorizoDados: false, declaroVerdadeiro: false
  });

  const [cidades, setCidades] = useState<string[]>([]);
  const listaEstados = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

  const aplicarDadosDoPerfil = (formEdit: {
    formData: Record<string, unknown>;
    cpf: string;
    telefone: string;
    telefone2: string;
    pretensaoSalarial: string;
    dataNascimentoDisplay: string;
    cursos: string[];
    empresas: { nome: string; cargo: string; dataInicio: string; dataFim: string }[];
  }) => {
    const dadosForm = formEdit.formData;

    setFormData((prev) => ({
      ...prev,
      nome: String(dadosForm.nome ?? prev.nome),
      dataNascimento: String(dadosForm.dataNascimento ?? prev.dataNascimento),
      idade: dadosForm.idade != null && dadosForm.idade !== ''
        ? String(dadosForm.idade)
        : prev.idade,
      sexoBiologico: dadosForm.sexoBiologico != null && dadosForm.sexoBiologico !== ''
        ? String(dadosForm.sexoBiologico)
        : prev.sexoBiologico,
      identidadeGenero: dadosForm.identidadeGenero != null && dadosForm.identidadeGenero !== ''
        ? String(dadosForm.identidadeGenero)
        : prev.identidadeGenero,
      orientacaoSexual: dadosForm.orientacaoSexual != null && dadosForm.orientacaoSexual !== ''
        ? String(dadosForm.orientacaoSexual)
        : prev.orientacaoSexual,
      estadoCivil: dadosForm.estadoCivil != null && dadosForm.estadoCivil !== ''
        ? String(dadosForm.estadoCivil)
        : prev.estadoCivil,
      religiao: dadosForm.religiao != null && dadosForm.religiao !== ''
        ? String(dadosForm.religiao)
        : prev.religiao,
      antecedentes: String(dadosForm.antecedentes ?? prev.antecedentes),
      possuiFilhos: String(dadosForm.possuiFilhos ?? prev.possuiFilhos),
      quantidadeFilhos: String(dadosForm.quantidadeFilhos ?? prev.quantidadeFilhos),
      faixaEtariaFilhos: Array.isArray(dadosForm.faixaEtariaFilhos)
        ? [...(dadosForm.faixaEtariaFilhos as string[])]
        : prev.faixaEtariaFilhos,
      email: String(dadosForm.email ?? prev.email),
      telefone: formEdit.telefone || String(dadosForm.telefone ?? prev.telefone),
      telefone2: formEdit.telefone2 || String(dadosForm.telefone2 ?? prev.telefone2),
      whatsapp: String(dadosForm.whatsapp ?? prev.whatsapp),
      estado: String(dadosForm.estado ?? prev.estado),
      cidade: String(dadosForm.cidade ?? prev.cidade),
      disponibilidadeMudanca: dadosForm.disponibilidadeMudanca != null && dadosForm.disponibilidadeMudanca !== ''
        ? String(dadosForm.disponibilidadeMudanca)
        : prev.disponibilidadeMudanca,
      escolaridade: dadosForm.escolaridade != null && dadosForm.escolaridade !== ''
        ? String(dadosForm.escolaridade)
        : prev.escolaridade,
      cursosCertificacoes: String(dadosForm.cursosCertificacoes ?? prev.cursosCertificacoes),
      situacaoProfissional: dadosForm.situacaoProfissional != null && dadosForm.situacaoProfissional !== ''
        ? String(dadosForm.situacaoProfissional)
        : prev.situacaoProfissional,
      areaInteresse: dadosForm.areaInteresse != null && dadosForm.areaInteresse !== ''
        ? String(dadosForm.areaInteresse)
        : prev.areaInteresse,
      cargoDesejado: String(dadosForm.cargoDesejado ?? prev.cargoDesejado),
      turnoDisponivel: dadosForm.turnoDisponivel != null && dadosForm.turnoDisponivel !== ''
        ? String(dadosForm.turnoDisponivel)
        : prev.turnoDisponivel,
      disponibilidadeInicio: dadosForm.disponibilidadeInicio != null && dadosForm.disponibilidadeInicio !== ''
        ? String(dadosForm.disponibilidadeInicio)
        : prev.disponibilidadeInicio,
      trabalhouIndustria: dadosForm.trabalhouIndustria != null && dadosForm.trabalhouIndustria !== ''
        ? String(dadosForm.trabalhouIndustria)
        : prev.trabalhouIndustria,
      tempoExperiencia: dadosForm.tempoExperiencia != null && dadosForm.tempoExperiencia !== ''
        ? String(dadosForm.tempoExperiencia)
        : prev.tempoExperiencia,
      experiencias: String(dadosForm.experiencias ?? prev.experiencias),
      recolocacao: dadosForm.recolocacao != null && dadosForm.recolocacao !== ''
        ? String(dadosForm.recolocacao)
        : prev.recolocacao,
      pretensaoSalarial: formEdit.pretensaoSalarial || String(dadosForm.pretensaoSalarial ?? prev.pretensaoSalarial),
      fotoPerfil: (dadosForm.fotoPerfil as string | null) ?? prev.fotoPerfil,
      curriculo: (dadosForm.curriculo as string | null) ?? prev.curriculo,
      atestado: (dadosForm.atestado as string | null) ?? prev.atestado,
      mensagemEmpresas: String(dadosForm.mensagemEmpresas ?? prev.mensagemEmpresas),
      segmentosIndustria: Array.isArray(dadosForm.segmentosIndustria) ? [...(dadosForm.segmentosIndustria as string[])] : prev.segmentosIndustria,
      maquinasEquipamentos: Array.isArray(dadosForm.maquinasEquipamentos) ? [...(dadosForm.maquinasEquipamentos as string[])] : prev.maquinasEquipamentos,
      qualidadeProcessos: Array.isArray(dadosForm.qualidadeProcessos) ? [...(dadosForm.qualidadeProcessos as string[])] : prev.qualidadeProcessos,
      informatica: Array.isArray(dadosForm.informatica) ? [...(dadosForm.informatica as string[])] : prev.informatica,
      possuiCNH: String(dadosForm.possuiCNH ?? prev.possuiCNH),
      categoriaCNH: String(dadosForm.categoriaCNH ?? prev.categoriaCNH),
      aceitaViagens: String(dadosForm.aceitaViagens ?? prev.aceitaViagens),
      disponivelContratacao: String(dadosForm.disponivelContratacao ?? prev.disponivelContratacao),
      certificados: (dadosForm.certificados as string | null) ?? prev.certificados,
      cnhDocumento: (dadosForm.cnhDocumento as string | null) ?? prev.cnhDocumento,
      autorizoDados: dadosForm.autorizoDados === true || prev.autorizoDados,
      declaroVerdadeiro: dadosForm.declaroVerdadeiro === true || prev.declaroVerdadeiro,
    }));

    setCpf(formEdit.cpf || '');
    setTelefone(formEdit.telefone || String(dadosForm.telefone || ''));
    setTelefone2(formEdit.telefone2 || String(dadosForm.telefone2 || ''));
    setPretensaoSalarial(formEdit.pretensaoSalarial || String(dadosForm.pretensaoSalarial || ''));
    setDataNascimentoValue(formEdit.dataNascimentoDisplay || '');
    setCursos(formEdit.cursos?.length ? [...formEdit.cursos] : ['']);
    if (Array.isArray(dadosForm.certificacoes)) {
      setCertificacoes([...(dadosForm.certificacoes as string[])]);
    }
    if (Array.isArray(dadosForm.idiomas)) {
      setIdiomas([...(dadosForm.idiomas as string[])]);
    }
    setEmpresas(
      formEdit.empresas?.length
        ? formEdit.empresas.map((e) => ({ ...e }))
        : [{ nome: '', cargo: '', dataInicio: '', dataFim: '' }]
    );
    setSenhaPreenchida(true);
  };

  const lerDadosLocais = (email?: string): Array<Record<string, unknown>> => {
    if (typeof window === 'undefined') return [];
    const fontes: Array<Record<string, unknown>> = [];
    const emailNorm = email?.toLowerCase().trim();

    const chaves = emailNorm
      ? [
          chavePorEmail(FORM_STORAGE_KEY, emailNorm),
          chavePorEmail(BACKUP_STORAGE_KEY, emailNorm),
        ]
      : [];

    const vistos = new Set<string>();

    for (const key of chaves) {
      if (vistos.has(key)) continue;
      vistos.add(key);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (emailNorm && !dadosPertencemAoUsuario(parsed, emailNorm)) continue;
        fontes.push(parsed);
      } catch {
        console.error(`Erro ao ler ${key}`);
      }
    }

    return fontes;
  };

  const salvarBackupLocal = (dados: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;

    const emailForm = String(dados.email || '').toLowerCase().trim();
    const emailSessao = session?.user?.email?.toLowerCase().trim() || '';

    let email = emailForm;
    if (emailForm && emailSessao && !emailsConferem(emailForm, emailSessao)) {
      email = emailForm;
    } else if (!emailForm && emailSessao) {
      email = emailSessao;
    }

    if (!email) return;

    const payload = sanitizarParaLocalStorage({ ...dados, _ownerEmail: email, email: dados.email || email });

    const keyForm = chavePorEmail(FORM_STORAGE_KEY, email);
    const keyBackup = chavePorEmail(BACKUP_STORAGE_KEY, email);

    const ok =
      tentarSalvarLocal(keyForm, payload)
      || tentarSalvarLocal(keyForm, {
        ...payload,
        fotoPerfil: null,
        curriculo: null,
        atestado: null,
        certificados: null,
        cnhDocumento: null,
      });

    if (ok) {
      tentarSalvarLocal(keyBackup, payload);
    }

    limparBackupsGlobaisAntigos();
  };

  // Modo edição: carrega somente da API (nunca localStorage de outro usuário)
  useEffect(() => {
    if (!isEditMode || typeof window === 'undefined') return;

    fetch('/api/professional/profile', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar o perfil');
        return res.json();
      })
      .then((data) => {
        if (data.formEdit) {
          aplicarDadosDoPerfil(data.formEdit);
        } else if (data.email) {
          setFormData((prev) => ({
            ...prev,
            email: data.email || prev.email,
            nome: data.nome && data.nome !== 'Usuário' ? data.nome : prev.nome,
          }));
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar perfil para edição:', err);
        alert('Não foi possível carregar seus dados. Tente novamente pelo painel.');
        router.push('/professional/dashboard');
      })
      .finally(() => {
        setProfileLoaded(true);
      });
  }, [isEditMode, router]);

  // Carrega dados do cadastro simples quando a página abre (novo cadastro)
  useEffect(() => {
    if (isEditMode || typeof window === 'undefined') return;
    if (sessionStatus === 'loading') return;

    const userType = (session?.user as { userType?: string } | undefined)?.userType?.toUpperCase();
    if (userType === 'COMPANY') {
      router.replace('/company/register');
      return;
    }

    const emailSessao = session?.user?.email?.toLowerCase().trim() || '';
    if (!emailSessao) {
      limparBackupsGlobaisAntigos();
      setProfileLoaded(true);
      return;
    }

    const lerJsonSeguro = (raw: string | null) => {
      if (!raw) return null;
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return null;
      }
    };

    const chavesSimples = [chavePorEmail(SIMPLE_STORAGE_KEY, emailSessao)];

    for (const key of chavesSimples) {
      const dados = lerJsonSeguro(localStorage.getItem(key));
      if (!dados) continue;
      if (!dadosPertencemAoUsuario(dados, emailSessao)) continue;

      setFormData(prev => ({
        ...prev,
        nome: String(dados.nome || prev.nome),
        email: String(dados.email || prev.email),
        telefone: String(dados.telefone || prev.telefone),
      }));
      setCpf(String(dados.cpf || ''));
      setTelefone(String(dados.telefone || ''));

      if (dados.password) {
        setPassword(String(dados.password));
        setConfirmPassword(String(dados.password));
        setSenhaPreenchida(true);
      }
      break;
    }

    const fontesFormulario = lerDadosLocais(emailSessao);
    const dados = fontesFormulario[0];
    if (dados) {
      if (dados.dataNascimentoDisplay) {
        setDataNascimentoValue(String(dados.dataNascimentoDisplay));
      }
      if (dados.telefone) setTelefone(String(dados.telefone));
      if (dados.telefone2) setTelefone2(String(dados.telefone2));
      if (dados.pretensaoSalarial) setPretensaoSalarial(String(dados.pretensaoSalarial));
      if (Array.isArray(dados.cursos) && dados.cursos.length > 0) {
        setCursos(dados.cursos as string[]);
      }
      if (Array.isArray(dados.empresas) && dados.empresas.length > 0) {
        setEmpresas(dados.empresas as typeof empresas);
      }

      setFormData((prev) => {
        const next: Record<string, unknown> = { ...prev };
        for (const [key, raw] of Object.entries(dados)) {
          if (key === 'dataNascimento' || raw === undefined || raw === null) continue;
          next[key] = raw;
        }
        return next as typeof prev;
      });
      if (dados.cpf) setCpf(String(dados.cpf));
    }

    limparBackupsGlobaisAntigos();
    setProfileLoaded(true);
  }, [isEditMode, sessionStatus, session?.user?.email, session?.user, router]);

  // Sessão Google: preenche dados básicos; se cadastro já completo, vai ao painel
  useEffect(() => {
    if (isEditMode) return;

    if (sessionStatus === 'unauthenticated') {
      setCheckingRegistration(false);
      return;
    }

    if (sessionStatus !== 'authenticated' || !session?.user) return;

    const userType = (session.user as { userType?: string }).userType?.toUpperCase();
    if (userType === 'COMPANY') {
      router.replace('/company/register');
      return;
    }

    setSenhaPreenchida(true);
    setPassword('');
    setConfirmPassword('');
    setCheckingRegistration(true);

    let redirecting = false;
    fetch('/api/professional/profile', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.registrationComplete) {
          redirecting = true;
          router.replace('/professional/dashboard');
          return;
        }

        setFormData((prev) => ({
          ...prev,
          email: session.user?.email || prev.email,
          nome: session.user?.name || prev.nome,
        }));
        setSenhaPreenchida(true);
      })
      .catch(() => {})
      .finally(() => {
        if (!redirecting) setCheckingRegistration(false);
      });
  }, [isEditMode, sessionStatus, session, router]);

  // Salvar dados do formulário no localStorage (somente cadastro novo)
  useEffect(() => {
    if (!profileLoaded || isEditMode || typeof window === 'undefined') return;

    if (typeof window !== 'undefined') {
      if (Object.values(formData).some(v => v !== '' && v !== false && v !== null) || dataNascimentoValue || cpf) {
        const dadosParaSalvar = {
          ...formData,
          cpf,
          telefone,
          telefone2,
          pretensaoSalarial,
          dataNascimentoDisplay: dataNascimentoValue,
          cursos,
          empresas,
        };
        salvarBackupLocal(dadosParaSalvar);
      }
    }
  }, [formData, cpf, dataNascimentoValue, telefone, telefone2, pretensaoSalarial, cursos, certificacoes, idiomas, empresas, profileLoaded, isEditMode]);

  const formatSalario = (value: string) => {
    let apenasNumeros = value.replace(/\D/g, '');
    apenasNumeros = apenasNumeros.replace(/^0+/, '') || '0';
    if (apenasNumeros === '0' || apenasNumeros === '') {
      setPretensaoSalarial('');
      setFormData((prev) => ({ ...prev, pretensaoSalarial: '' }));
      return;
    }
    let centavos = '';
    let inteiro = '';
    if (apenasNumeros.length === 1) {
      inteiro = '0';
      centavos = '0' + apenasNumeros;
    } else if (apenasNumeros.length === 2) {
      inteiro = '0';
      centavos = apenasNumeros;
    } else {
      centavos = apenasNumeros.slice(-2);
      inteiro = apenasNumeros.slice(0, -2);
    }
    const partes = inteiro.split('').reverse();
    const inteiroFormatado = partes
      .reduce((acc: string[], digit, index) => {
        if (index > 0 && index % 3 === 0) acc.push('.');
        acc.push(digit);
        return acc;
      }, [])
      .reverse()
      .join('');
    const salarioFormatado = inteiroFormatado + ',' + centavos;
    setPretensaoSalarial(salarioFormatado);
    setFormData((prev) => ({ ...prev, pretensaoSalarial: salarioFormatado }));
  };

  const completionPercent = calculateProfileCompletion({
    ...formData,
    telefone,
    telefone2,
    pretensaoSalarial,
    dataNascimentoDisplay: dataNascimentoValue,
    cursos: cursos.filter((c) => c.trim()),
    certificacoes: certificacoes.filter((c) => c.trim()),
    idiomas: idiomas.filter((i) => i.trim()),
    empresas,
  });

  const cadastroComGoogle = sessionStatus === 'authenticated' && !!session?.user?.email;
  const exibirCamposSenha = !isEditMode && !cadastroComGoogle;

  const uploadFile = async (file: File, type: string): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && data.file?.url) return data.file.url as string;
    } catch (err) {
      console.error('Erro no upload:', err);
    }
    return null;
  };

  // Carrega cidades a partir do estado selecionado
  useEffect(() => {
    if (formData.estado) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.estado}/municipios`)
        .then(res => res.json())
        .then(data => setCidades(data.map((c: any) => c.nome).sort()))
        .catch(err => console.error('Erro ao buscar cidades do IBGE:', err));
    }
  }, [formData.estado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDAÇÃO 1: CPF obrigatório
    if (!cpf || cpf.length < 14) {
      alert('CPF é obrigatório e deve estar completo (000.000.000-00)');
      return;
    }

    // VALIDAÇÃO 2: CPF não pode ter erro
    if (cpfError) {
      alert('CPF inválido: ' + cpfError);
      return;
    }

    // VALIDAÇÃO 3: Email obrigatório e válido
    if (!formData.email || !isValidEmail(formData.email)) {
      setEmailError('Email é obrigatório e deve ser válido');
      alert('Por favor, preencha um email válido');
      return;
    }

    // Validação de senha só quando o usuário informou senha (cadastro com e-mail/senha)
    const liveSession = await getSession();
    const sessionEmail = liveSession?.user?.email?.toLowerCase().trim() || '';
    const formEmail = formData.email.toLowerCase().trim();
    const sessaoAtiva = emailsConferem(sessionEmail, formEmail);

    if (sessionEmail && formEmail && !sessaoAtiva) {
      alert(
        `Você está logado como ${sessionEmail}, mas o cadastro é para ${formEmail}. Saia da conta atual e tente novamente.`,
      );
      return;
    }

    if (!sessaoAtiva) {
      if (!password || password.length < 8) {
        alert('Senha deve ter mínimo 8 caracteres');
        return;
      }

      if (!confirmPassword) {
        alert('Confirmação de senha é obrigatória');
        return;
      }

      if (password !== confirmPassword) {
        alert('As senhas não conferem');
        return;
      }
    }

    const telOk = telefone.replace(/\D/g, '').length >= 10 || telefone2.replace(/\D/g, '').length >= 10;
    if (!telOk) {
      alert('Informe WhatsApp ou telefone com DDD.');
      return;
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

    const dadosParaSalvar = {
      ...formData,
      pretensaoSalarial,
      profileCompletion: completionPercent,
      cpf: cpfLimpo,
      nome: formData.nome,
      telefone,
      telefone2,
      dataNascimento: formData.dataNascimento || dataNascimentoValue,
      dataNascimentoDisplay: dataNascimentoValue,
      experiencias: empresas.filter((e) => e.nome.trim() || e.cargo.trim()),
      cursosCertificacoes: cursos.filter((c) => c.trim()),
      cursos,
      certificacoes: certificacoes.filter((c) => c.trim()),
      idiomas: idiomas.filter((i) => i.trim()),
      empresas,
    };

    setSubmitting(true);
    try {
      const finalizarPerfil = async (mensagemSucesso?: string) => {
        const profileRes = await fetch('/api/professional/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dadosParaSalvar),
        });

        const profileData = await parseJsonSafe(profileRes);

        if (profileRes.status === 401) {
          alert('Sessão expirada. Entre com Google novamente e complete o cadastro.');
          router.push('/login?tipo=profissional');
          return;
        }

        if (!profileRes.ok) {
          throw new Error(String(profileData.error || 'Erro ao salvar perfil'));
        }

        if (profileData.success) {
          salvarBackupLocal({
            ...dadosParaSalvar,
            dataNascimentoDisplay: dataNascimentoValue,
          });
          localStorage.removeItem('dadosCadastroSimples');
          if (mensagemSucesso) alert(mensagemSucesso);
          router.push('/professional/dashboard');
          return;
        }

        alert('Erro ao salvar perfil: ' + (profileData.error || 'Desconhecido'));
      };

      if (isEditMode) {
        await finalizarPerfil('Cadastro atualizado com sucesso!');
        return;
      }

      if (sessaoAtiva) {
        await finalizarPerfil();
        return;
      }

      // Cookie de sessão pode existir mesmo quando getSession() no cliente falha
      const probeSessao = await fetch('/api/professional/profile', {
        credentials: 'include',
      });
      if (probeSessao.ok) {
        const probeData = await parseJsonSafe(probeSessao);
        const probeEmail = String(probeData.email || '').toLowerCase().trim();
        if (emailsConferem(probeEmail, formEmail)) {
          await finalizarPerfil();
          return;
        }
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dadosParaSalvar,
          email: formData.email,
          password,
          confirmPassword,
          userType: 'professional',
          name: formData.nome,
          curriculoURL: formData.curriculo || null,
          atestadoURL: formData.atestado || null,
          fotoPerfil: formData.fotoPerfil || null,
        })
      });

      const data = await parseJsonSafe(res);

      if (!data.success) {
        if (
          res.status === 409 ||
          data.error === 'Email já cadastrado' ||
          data.code === 'OAUTH_ACCOUNT_EXISTS'
        ) {
          const retryPerfil = await fetch('/api/professional/profile', {
            credentials: 'include',
          });
          if (retryPerfil.ok) {
            const retryData = await parseJsonSafe(retryPerfil);
            const retryEmail = String(retryData.email || '').toLowerCase().trim();
            if (emailsConferem(retryEmail, formEmail)) {
              await finalizarPerfil();
              return;
            }
          }
          if (data.code === 'OAUTH_ACCOUNT_EXISTS') {
            alert(data.error);
            router.push('/login?tipo=profissional');
            return;
          }
          await finalizarPerfil();
          return;
        }
        throw new Error(String(data.error || 'Erro ao registrar'));
      }

      if (data.completedExisting) {
        salvarBackupLocal({
          ...dadosParaSalvar,
          dataNascimentoDisplay: dataNascimentoValue,
        });
        localStorage.removeItem('dadosCadastroSimples');
        router.push('/professional/dashboard');
        return;
      }

      // API de registro já cria usuário + perfil; só faz login se tiver senha
      if (password) {
        const signResult = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password,
        });

        if (signResult?.ok) {
          salvarBackupLocal({
            ...dadosParaSalvar,
            dataNascimentoDisplay: dataNascimentoValue,
          });
          localStorage.removeItem('dadosCadastroSimples');
          router.push('/professional/dashboard');
          return;
        }
      }

      salvarBackupLocal({
        ...dadosParaSalvar,
        dataNascimentoDisplay: dataNascimentoValue,
      });
      localStorage.removeItem('dadosCadastroSimples');
      alert('Cadastro realizado com sucesso! Faça login para acessar o painel.');
      router.push('/login?tipo=profissional');

    } catch (err: any) {
      console.error('Erro no registro:', err);
      alert(err.message || 'Erro ao conectar ao servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const paginaCarregando = sessionStatus === 'loading' || !profileLoaded || checkingRegistration;
  const mensagemCarregamento = !profileLoaded
    ? 'Carregando seus dados...'
    : checkingRegistration
      ? 'Verificando cadastro...'
      : 'Carregando...';

  if (paginaCarregando) {
    return <PageLoader message={mensagemCarregamento} />;
  }

  return (
    <div className={`${styles.container} ri-readable`}>
      {submitting && <PageLoader message="Salvando cadastro..." mode="overlay" />}
      <div className={styles.card} role="main" aria-labelledby="register-title">
        <h1 id="register-title" className={styles.title}>
          {isEditMode ? 'Atualizar cadastro' : 'Cadastro do profissional'}
        </h1>
        {isEditMode && (
          <p style={{ color: '#F2F2F2', marginTop: 0, marginBottom: 20, fontSize: 15 }}>
            Seus dados foram carregados. Altere o que precisar e clique em salvar.
          </p>
        )}

        <ProfileCompletionBar percent={completionPercent} />

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          
          <section>
            <RegisterSectionHeader emoji="🏭" title="Dados pessoais" />
            
            <label className={styles.label} htmlFor="nome">Nome completo</label>
            <input 
              id="nome" 
              type="text" 
              required 
              className={styles.input}
              value={formData.nome}
              onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
            />

            <label className={styles.label} htmlFor="cpf">CPF</label>
            <input 
              id="cpf" 
              type="text" 
              required 
              className={styles.input}
              placeholder="000.000.000-00"
              maxLength={14}
              value={cpf}
              onChange={(e) => {
                const value = e.target.value;
                const cpfLimpo = value.replace(/\D/g, '');
                
                if (cpfLimpo.length > 11) return;
                
                let cpfFormatado = '';
                if (cpfLimpo.length > 0) {
                  cpfFormatado = cpfLimpo.slice(0, 3);
                  if (cpfLimpo.length > 3) {
                    cpfFormatado += '.' + cpfLimpo.slice(3, 6);
                  }
                  if (cpfLimpo.length > 6) {
                    cpfFormatado += '.' + cpfLimpo.slice(6, 9);
                  }
                  if (cpfLimpo.length > 9) {
                    cpfFormatado += '-' + cpfLimpo.slice(9, 11);
                  }
                }
                
                setCpf(cpfFormatado);
                
                if (cpfLimpo.length === 11) {
                  setCpfValidating(true);
                  fetch('/api/auth/validate-cpf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cpf: cpfLimpo })
                  })
                    .then(res => res.json())
                    .then(data => {
                      if (data.valid) {
                        setCpfError('');
                      } else {
                        setCpfError(data.message);
                      }
                      setCpfValidating(false);
                    })
                    .catch(err => {
                      console.error('Erro ao validar CPF:', err);
                      setCpfValidating(false);
                    });
                } else {
                  setCpfError('');
                }
              }}
              style={{ borderColor: cpfError ? '#dc3545' : undefined }}
            />
            
            {cpfValidating && (
              <div style={{
                color: '#F2F2F2',
                fontSize: '13px',
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#111111',
                border: '1px solid #8D6B1F',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>⏳</span>
                <span><strong>Validando CPF...</strong></span>
              </div>
            )}
            
            {!cpfValidating && cpfError && (
              <div style={{
                color: '#dc3545',
                fontSize: '13px',
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <span><strong>Erro:</strong> {cpfError}</span>
              </div>
            )}
            
            {!cpfValidating && cpf.length === 14 && !cpfError && (
              <div style={{
                color: '#F2F2F2',
                fontSize: '13px',
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#111111',
                border: '1px solid #8D6B1F',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>✅</span>
                <span><strong>CPF válido e disponível!</strong></span>
              </div>
            )}

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="dataNascimento">Data de nascimento (DD/MM/AAAA)</label>
                <input 
                  id="dataNascimento" 
                  type="text"
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  required 
                  className={styles.input}
                  value={dataNascimentoValue}
                  onChange={e => {
                    let value = e.target.value.replace(/\D/g, '');
                    
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2);
                    }
                    if (value.length >= 5) {
                      value = value.slice(0, 5) + '/' + value.slice(5, 9);
                    }
                    
                    setDataNascimentoValue(value);
                    
                    if (value.length === 10) {
                      const [day, month, year] = value.split('/');
                      const dayNum = parseInt(day);
                      const monthNum = parseInt(month);
                      const yearNum = parseInt(year);
                      
                      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum > 1900) {
                        const birth = new Date(yearNum, monthNum - 1, dayNum);
                        const today = new Date();
                        
                        if (birth.getDate() === dayNum) {
                          const age = today.getFullYear() - birth.getFullYear();
                          const monthDiff = today.getMonth() - birth.getMonth();
                          const dayDiff = today.getDate() - birth.getDate();
                          
                          const finalAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
                          const isoDate = `${String(yearNum).padStart(4, '0')}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          
                          setFormData((prev) => ({ ...prev, dataNascimento: isoDate, idade: finalAge.toString() }));
                        }
                      }
                    }
                  }} 
                />
              </div>
              <div>
                <label className={styles.label} htmlFor="idade">Idade</label>
                <input id="idade" type="text" className={styles.input} value={formData.idade} onChange={e => setFormData((prev) => ({ ...prev, idade: e.target.value }))} />
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="sexoBiologico">Sexo biológico</label>
                <select
                  id="sexoBiologico"
                  className={styles.select}
                  value={formData.sexoBiologico}
                  onChange={e => setFormData((prev) => ({ ...prev, sexoBiologico: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option>Masculino</option>
                  <option>Feminino</option>
                  <option>Outro</option>
                  <option>{PREFIRO_NAO_INFORMAR}</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="identidadeGenero">Identidade de gênero</label>
                <select
                  id="identidadeGenero"
                  className={styles.select}
                  value={formData.identidadeGenero}
                  onChange={e => setFormData((prev) => ({ ...prev, identidadeGenero: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option>Cisgênero</option>
                  <option>Transgênero</option>
                  <option>Não-binário</option>
                  <option>Outro</option>
                  <option>{PREFIRO_NAO_INFORMAR}</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="orientacaoSexual">Orientação sexual</label>
                <select
                  id="orientacaoSexual"
                  className={styles.select}
                  value={formData.orientacaoSexual}
                  onChange={e => setFormData((prev) => ({ ...prev, orientacaoSexual: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option>Heterossexual</option>
                  <option>Homossexual</option>
                  <option>Bissexual</option>
                  <option>Outro</option>
                  <option>{PREFIRO_NAO_INFORMAR}</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="estadoCivil">Estado civil</label>
                <select
                  id="estadoCivil"
                  className={styles.select}
                  value={formData.estadoCivil}
                  onChange={e => setFormData((prev) => ({ ...prev, estadoCivil: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option>Solteiro</option>
                  <option>Casado</option>
                  <option>Divorciado</option>
                  <option>Viúvo</option>
                  <option>{PREFIRO_NAO_INFORMAR}</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="religiao">Religião</label>
                <select
                  id="religiao"
                  className={styles.select}
                  value={formData.religiao}
                  onChange={e => setFormData((prev) => ({ ...prev, religiao: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option>Católico</option>
                  <option>Protestante</option>
                  <option>Espírita</option>
                  <option>Ateu</option>
                  <option>Outro</option>
                  <option>{PREFIRO_NAO_INFORMAR}</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="antecedentes">Antecedentes criminais</label>
                <select
                  id="antecedentes"
                  className={styles.select}
                  value={formData.antecedentes}
                  onChange={e => setFormData((prev) => ({ ...prev, antecedentes: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                  <option value={PREFIRO_NAO_INFORMAR}>{PREFIRO_NAO_INFORMAR}</option>
                </select>
              </div>
            </div>

            <label className={styles.label} htmlFor="possuiCNH">Possui CNH?</label>
            <select
              id="possuiCNH"
              className={styles.select}
              value={formData.possuiCNH}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                possuiCNH: e.target.value,
                categoriaCNH: e.target.value === 'Não' ? '' : prev.categoriaCNH,
              }))}
            >
              <option value="">Selecione</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
              <option value={PREFIRO_NAO_INFORMAR}>{PREFIRO_NAO_INFORMAR}</option>
            </select>
            {formData.possuiCNH === 'Sim' && (
              <>
                <label className={styles.label} htmlFor="categoriaCNH">Categoria da CNH</label>
                <select
                  id="categoriaCNH"
                  className={styles.select}
                  value={formData.categoriaCNH}
                  onChange={(e) => setFormData((prev) => ({ ...prev, categoriaCNH: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {CNH_CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </>
            )}
          </section>

          <section>
            <RegisterSectionHeader emoji="👨‍👩‍👧‍👦" title="Filhos" />
            
            <label className={styles.label} htmlFor="possuiFilhos">Possui filhos?</label>
            <select id="possuiFilhos" className={styles.select} value={formData.possuiFilhos} onChange={e => setFormData((prev) => ({ ...prev, possuiFilhos: e.target.value }))}>
              <option value="">Selecione</option>
              <option>Não</option>
              <option>Sim</option>
            </select>

            {formData.possuiFilhos === 'Sim' && (
              <>
                <label className={styles.label} htmlFor="quantidadeFilhos">Quantidade de filhos</label>
                <select 
                  id="quantidadeFilhos" 
                  className={styles.select} 
                  value={formData.quantidadeFilhos}
                  onChange={e => setFormData((prev) => ({ ...prev, quantidadeFilhos: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4+</option>
                </select>

                <fieldset>
                  <legend className={styles.label}>Faixa etária dos filhos</legend>
                  {['Menos de 1', '1 a 3', '3 a 5', '5 a 7', '7 a 9', '9 a 12', 'Acima de 12'].map(faixa => (
                    <label key={faixa} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={formData.faixaEtariaFilhos.includes(faixa)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData((prev) => ({ ...prev, faixaEtariaFilhos: [...prev.faixaEtariaFilhos, faixa] }));
                          } else {
                            setFormData((prev) => ({ ...prev, faixaEtariaFilhos: prev.faixaEtariaFilhos.filter(f => f !== faixa) }));
                          }
                        }}
                      /> {faixa}
                    </label>
                  ))}
                </fieldset>
              </>
            )}
          </section>

          <section>
            <RegisterSectionHeader emoji="📞" title="Contato" />
            
            <label className={styles.label} htmlFor="email">E-mail</label>
            <input 
              id="email" 
              type="email" 
              required 
              className={styles.input}
              value={formData.email}
              onChange={(e) => {
                const email = e.target.value;
                setFormData((prev) => ({ ...prev, email }));
                if (email && !isValidEmail(email)) {
                  setEmailError('Email inválido');
                } else {
                  setEmailError('');
                }
              }}
              style={{ borderColor: emailError ? '#dc3545' : undefined }}
            />
            {emailError && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', display: 'block' }}>❌ {emailError}</span>}

            {cadastroComGoogle && (
              <p style={{ color: '#F2F2F2', fontSize: 13, margin: '8px 0 0' }}>
                Você entrou com Google. Não é necessário criar senha.
              </p>
            )}

            {exibirCamposSenha && (
              <>
                <label className={styles.label} htmlFor="password">Senha *</label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <PasswordStrengthMeter password={password} />

                <label className={styles.label} htmlFor="confirmPassword" style={{ marginTop: 12 }}>
                  Confirmar senha *
                </label>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <label className={styles.checkboxLabel} style={{ marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={showPassword || showConfirmPassword}
                    onChange={(e) => {
                      setShowPassword(e.target.checked);
                      setShowConfirmPassword(e.target.checked);
                    }}
                  />
                  Mostrar senhas
                </label>
              </>
            )}

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="telefone">Telefone / WhatsApp (DDD)</label>
                <input 
                  id="telefone" 
                  type="tel" 
                  className={styles.input}
                  placeholder="(XX) XXXXX-XXXX"
                  value={telefone}
                  onChange={(e) => {
                    const value = e.target.value;
                    const telefoneLimpo = value.replace(/\D/g, '');
                    
                    let telefoneFormatado = '';
                    if (telefoneLimpo.length > 0) {
                      if (telefoneLimpo.length <= 2) {
                        telefoneFormatado = '(' + telefoneLimpo;
                      } else if (telefoneLimpo.length <= 7) {
                        telefoneFormatado = '(' + telefoneLimpo.slice(0, 2) + ') ' + telefoneLimpo.slice(2);
                      } else {
                        telefoneFormatado = '(' + telefoneLimpo.slice(0, 2) + ') ' + telefoneLimpo.slice(2, 7) + '-' + telefoneLimpo.slice(7, 11);
                      }
                    }
                    
                    setTelefone(telefoneFormatado);
                    setFormData((prev) => ({ ...prev, telefone: telefoneFormatado }));
                  }}
                />
              </div>
              <div>
                <label className={styles.label} htmlFor="whatsapp">Este número é WhatsApp?</label>
                <select
                  id="whatsapp"
                  className={styles.select}
                  value={formData.whatsapp}
                  onChange={e => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="telefone2">Telefone alternativo (DDD)</label>
                <input 
                  id="telefone2" 
                  type="tel" 
                  className={styles.input}
                  placeholder="(XX) XXXXX-XXXX"
                  value={telefone2}
                  onChange={(e) => {
                    const value = e.target.value;
                    const telefoneLimpo = value.replace(/\D/g, '');
                    
                    let telefoneFormatado = '';
                    if (telefoneLimpo.length > 0) {
                      if (telefoneLimpo.length <= 2) {
                        telefoneFormatado = '(' + telefoneLimpo;
                      } else if (telefoneLimpo.length <= 7) {
                        telefoneFormatado = '(' + telefoneLimpo.slice(0, 2) + ') ' + telefoneLimpo.slice(2);
                      } else {
                        telefoneFormatado = '(' + telefoneLimpo.slice(0, 2) + ') ' + telefoneLimpo.slice(2, 7) + '-' + telefoneLimpo.slice(7, 11);
                      }
                    }
                    
                    setTelefone2(telefoneFormatado);
                    setFormData((prev) => ({ ...prev, telefone2: telefoneFormatado }));
                  }}
                />
              </div>
            </div>
          </section>

          <section>
            <RegisterSectionHeader emoji="📍" title="Localização" />
            
            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="estado">Estado (UF)</label>
                <select id="estado" className={styles.select} required value={formData.estado} onChange={e => setFormData((prev) => ({ ...prev, estado: e.target.value }))}>
                  <option value="">Selecione</option>
                  {listaEstados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="cidade">Cidade</label>
                <select
                  id="cidade"
                  className={styles.select}
                  required
                  value={formData.cidade}
                  onChange={e => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                >
                  <option value="">Escolha a cidade</option>
                  {cidades.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <label className={styles.label} htmlFor="disponibilidadeMudanca">Disponibilidade para mudança</label>
            <select
              id="disponibilidadeMudanca"
              className={styles.select}
              value={formData.disponibilidadeMudanca}
              onChange={e => setFormData((prev) => ({ ...prev, disponibilidadeMudanca: e.target.value }))}
            >
              <option value="">Selecione</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
              <option value="Dependendo da oportunidade">Dependendo da oportunidade</option>
            </select>
          </section>

          <section>
            <RegisterSectionHeader emoji="🎓" title="Formação" />
            
            <label className={styles.label} htmlFor="escolaridade">Escolaridade</label>
            <select
              id="escolaridade"
              className={styles.select}
              required
              value={formData.escolaridade}
              onChange={e => setFormData((prev) => ({ ...prev, escolaridade: e.target.value }))}
            >
              <option value="">Selecione</option>
              <option>Fundamental incompleto</option>
              <option>Fundamental completo</option>
              <option>Médio incompleto</option>
              <option>Médio completo</option>
              <option>Técnico</option>
              <option>Superior incompleto</option>
              <option>Superior completo</option>
              <option>Pós-graduação</option>
              <option>MBA</option>
            </select>

            <label className={styles.label}>Cursos</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cursos.map((curso, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={`Curso ${index + 1}`}
                    value={curso}
                    onChange={(e) => {
                      const novosCursos = [...cursos];
                      novosCursos[index] = e.target.value;
                      setCursos(novosCursos);
                      setFormData((prev) => ({ ...prev, cursosCertificacoes: novosCursos.filter(c => c.trim()).join(', ') }));
                    }}
                    style={{ flex: 1 }}
                  />
                  {cursos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const novosCursos = cursos.filter((_, i) => i !== index);
                        setCursos(novosCursos);
                        setFormData((prev) => ({ ...prev, cursosCertificacoes: novosCursos.filter(c => c.trim()).join(', ') }));
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCursos([...cursos, ''])}
                style={{
                  padding: '10px',
                  background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginTop: '5px'
                }}
              >
                + Adicionar outro curso
              </button>
            </div>

            <label className={styles.label}>Certificações</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {certificacoes.map((cert, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={`Certificação ${index + 1}`}
                    value={cert}
                    onChange={(e) => {
                      const novas = [...certificacoes];
                      novas[index] = e.target.value;
                      setCertificacoes(novas);
                    }}
                    style={{ flex: 1 }}
                  />
                  {certificacoes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCertificacoes(certificacoes.filter((_, i) => i !== index))}
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCertificacoes([...certificacoes, ''])}
                style={{
                  padding: '10px',
                  background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginTop: '5px'
                }}
              >
                + Adicionar certificação
              </button>
            </div>

            <label className={styles.label}>Quais idiomas você fala?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {idiomas.map((idioma, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={`Ex: Português (nativo), Inglês (intermediário)`}
                    value={idioma}
                    onChange={(e) => {
                      const novosIdiomas = [...idiomas];
                      novosIdiomas[index] = e.target.value;
                      setIdiomas(novosIdiomas);
                    }}
                    style={{ flex: 1 }}
                  />
                  {idiomas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setIdiomas(idiomas.filter((_, i) => i !== index))}
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setIdiomas([...idiomas, ''])}
                style={{
                  padding: '10px',
                  background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginTop: '5px'
                }}
              >
                + Adicionar idioma
              </button>
            </div>
          </section>

          <section>
            <RegisterSectionHeader emoji="💼" title="Perfil profissional" />
            
            <label className={styles.label} htmlFor="situacaoProfissional">Situação profissional atual</label>
            <select 
              id="situacaoProfissional" 
              className={styles.select} 
              required
              value={formData.situacaoProfissional}
              onChange={e => setFormData((prev) => ({ ...prev, situacaoProfissional: e.target.value }))}
            >
              <option value="">Selecione</option>
              <option value="Empregado">Empregado</option>
              <option value="Desempregado">Desempregado</option>
              <option value="Primeiro emprego">Primeiro emprego</option>
              <option value="Jovem Aprendiz (16 a 18)">Jovem Aprendiz (16 a 18)</option>
            </select>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="areaInteresse">Área de interesse</label>
                <select 
                  id="areaInteresse" 
                  className={styles.select} 
                  required
                  value={formData.areaInteresse}
                  onChange={e => setFormData((prev) => ({ ...prev, areaInteresse: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option>Automotivo</option>
                  <option>Aviação</option>
                  <option>Celulose e Papel</option>
                  <option>Cerâmica</option>
                  <option>Construção Civil</option>
                  <option>Defesa e Segurança</option>
                  <option>Eletricidade</option>
                  <option>Eletrônica</option>
                  <option>Energia</option>
                  <option>Engenharia</option>
                  <option>Farmacêutica</option>
                  <option>Ferramentas</option>
                  <option>Fiação e Tecelagem</option>
                  <option>Fundição</option>
                  <option>Gás Industrial</option>
                  <option>Indústria Alimentícia</option>
                  <option>Indústria Beverages</option>
                  <option>Indústria Cosmética</option>
                  <option>Indústria de Embalagem</option>
                  <option>Indústria de Máquinas</option>
                  <option>Indústria de Plástico</option>
                  <option>Indústria de Química</option>
                  <option>Indústria de Vestuário</option>
                  <option>Indústria Gráfica</option>
                  <option>Indústria Metal-Mecânica</option>
                  <option>Indústria Têxtil</option>
                  <option>Infraestrutura</option>
                  <option>Instalações Elétricas</option>
                  <option>Laminação</option>
                  <option>Logística Industrial</option>
                  <option>Louças e Vidros</option>
                  <option>Madeira e Móveis</option>
                  <option>Manutenção Industrial</option>
                  <option>Mármore e Granito</option>
                  <option>Materiais de Construção</option>
                  <option>Materiais Elétricos</option>
                  <option>Mecânica de Precisão</option>
                  <option>Mecânica Industrial</option>
                  <option>Metalurgia</option>
                  <option>Mineração</option>
                  <option>Petroquímica</option>
                  <option>Plástico</option>
                  <option>Pneumática e Hidráulica</option>
                  <option>Produtos Químicos</option>
                  <option>Refinaria</option>
                  <option>Siderurgia</option>
                  <option>Solda e Estruturas Metálicas</option>
                  <option>Tratamento de Água</option>
                  <option>Tratamento de Resíduos</option>
                  <option>Tubo e Conexões</option>
                  <option>Usina Hidrelétrica</option>
                  <option>Usina Termelétrica</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="cargoDesejado">Cargo desejado</label>
                <input 
                  id="cargoDesejado" 
                  type="text" 
                  required 
                  className={styles.input}
                  value={formData.cargoDesejado}
                  onChange={e => setFormData((prev) => ({ ...prev, cargoDesejado: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="turnoDisponivel">Turno disponível</label>
                <select 
                  id="turnoDisponivel" 
                  className={styles.select} 
                  value={formData.turnoDisponivel}
                  onChange={e => setFormData((prev) => ({ ...prev, turnoDisponivel: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Integral">Integral</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="disponibilidadeInicio">Disponibilidade para início</label>
                <select 
                  id="disponibilidadeInicio" 
                  className={styles.select} 
                  value={formData.disponibilidadeInicio}
                  onChange={e => setFormData((prev) => ({ ...prev, disponibilidadeInicio: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="Imediata">Imediata</option>
                  <option value="15 dias">15 dias</option>
                  <option value="30 dias">30 dias</option>
                  <option value="2 meses">2 meses</option>
                </select>
              </div>
            </div>

            <label className={styles.label} htmlFor="pretensaoSalarial">Pretensão salarial</label>
            <input
              id="pretensaoSalarial"
              type="text"
              className={styles.input}
              placeholder="Ex: 2.500,00"
              value={pretensaoSalarial}
              onChange={(e) => formatSalario(e.target.value)}
            />
          </section>

          <section>
            <RegisterSectionHeader emoji="💼" title="Experiência na indústria" />
            
            <label className={styles.label} htmlFor="trabalhouIndustria">Trabalhou na indústria?</label>
            <select 
              id="trabalhouIndustria" 
              className={styles.select} 
              required 
              value={formData.trabalhouIndustria} 
              onChange={e => setFormData((prev) => ({ ...prev, trabalhouIndustria: e.target.value }))}
            >
              <option value="">Selecione</option>
              <option value="Não">Não</option>
              <option value="Primeiro emprego">Primeiro emprego</option>
              <option value="Jovem aprendiz">Jovem aprendiz</option>
              <option value="Sim">Sim</option>
            </select>

            {formData.trabalhouIndustria === 'Sim' && (
              <>
                <label className={styles.label} htmlFor="tempoExperiencia">Tempo total de experiência</label>
                <select 
                  id="tempoExperiencia" 
                  className={styles.select} 
                  value={formData.tempoExperiencia}
                  onChange={e => setFormData((prev) => ({ ...prev, tempoExperiencia: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="Menos de 1 ano">Menos de 1 ano</option>
                  <option value="1-2 anos">1-2 anos</option>
                  <option value="3-5 anos">3-5 anos</option>
                  <option value="6-10 anos">6-10 anos</option>
                  <option value="Mais de 10 anos">Mais de 10 anos</option>
                </select>

                <label className={styles.label}>Experiências profissionais</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {empresas.map((empresa, index) => (
                    <div key={index} style={{ border: '1px solid #8D6B1F', padding: '15px', borderRadius: '4px', backgroundColor: '#111111' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#C89B3C' }}>Empresa {index + 1}</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Nome da empresa"
                          value={empresa.nome}
                          onChange={(e) => {
                            const novasEmpresas = [...empresas];
                            novasEmpresas[index].nome = e.target.value;
                            setEmpresas(novasEmpresas);
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#C89B3C' }}>Cargo</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Ex: Eletricista, Soldador"
                          value={empresa.cargo}
                          onChange={(e) => {
                            const novasEmpresas = [...empresas];
                            novasEmpresas[index].cargo = e.target.value;
                            setEmpresas(novasEmpresas);
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#C89B3C' }}>Início (Mês/Ano)</label>
                          <input
                            type="month"
                            className={styles.input}
                            value={empresa.dataInicio}
                            onChange={(e) => {
                              const novasEmpresas = [...empresas];
                              novasEmpresas[index].dataInicio = e.target.value;
                              setEmpresas(novasEmpresas);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#C89B3C' }}>Fim (Mês/Ano)</label>
                          <input
                            type="month"
                            className={styles.input}
                            value={empresa.dataFim}
                            required={index === 0}
                            onChange={(e) => {
                              const novasEmpresas = [...empresas];
                              novasEmpresas[index].dataFim = e.target.value;
                              setEmpresas(novasEmpresas);
                            }}
                          />
                        </div>
                      </div>

                      {empresas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const novasEmpresas = empresas.filter((_, i) => i !== index);
                            setEmpresas(novasEmpresas);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px',
                            background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        >
                          ✕ Remover empresa
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEmpresas([...empresas, { nome: '', cargo: '', dataInicio: '', dataFim: '' }])}
                    style={{
                      padding: '10px',
                      background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    + Adicionar outra empresa
                  </button>
                </div>
              </>
            )}
          </section>

          <RegisterExtendedSections
            formData={formData}
            setFormData={setFormData as React.Dispatch<React.SetStateAction<import('./RegisterExtendedSections').ExtendedFormFields & Record<string, unknown>>>}
          />

          <section>
            <RegisterSectionHeader emoji="✍️" title="Apresentação profissional" />
            
            <label className={styles.label} htmlFor="mensagemEmpresas">Mensagem para empresas</label>
            <textarea
              id="mensagemEmpresas"
              className={`${styles.input} ${styles.textarea}`}
              rows={4}
              placeholder="Conte um pouco sobre você, seus objetivos profissionais ou qualquer informação que gostaria que as empresas soubessem..."
              value={formData.mensagemEmpresas}
              onChange={e => setFormData((prev) => ({ ...prev, mensagemEmpresas: e.target.value }))}
            ></textarea>
          </section>

          <section>
            <RegisterSectionHeader emoji="📄" title="Documentos" />
            
            <CampoFotoPerfil
              value={formData.fotoPerfil}
              onFileSelect={async (file) => {
                const reader = new FileReader();
                reader.onloadend = async () => {
                  const previewUrl = reader.result as string;
                  setFormData((prev) => ({ ...prev, fotoPerfil: previewUrl }));

                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('type', 'avatars');

                    const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
                    const data = await res.json();

                    if (res.ok && data.success && data.file?.url) {
                      setFormData((prev) => ({ ...prev, fotoPerfil: data.file.url }));
                    }
                  } catch (err) {
                    console.error('Erro no upload da foto:', err);
                  }
                };
                reader.readAsDataURL(file);
              }}
            />

            <CampoArquivoAnexo
              id="curriculo"
              label="Currículo PDF"
              accept=".pdf,.doc,.docx"
              value={formData.curriculo}
              textoBotaoVazio="Selecionar currículo"
              onFileSelect={async (file) => {
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('type', 'documents');
                  const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
                  const data = await res.json();
                  if (res.ok && data.success && data.file?.url) {
                    setFormData((prev) => ({ ...prev, curriculo: data.file.url }));
                  } else if (res.status === 401) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData((prev) => ({ ...prev, curriculo: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  } else {
                    console.error('Upload curriculo falhou', data);
                    alert('Erro ao enviar currículo');
                  }
                } catch (err) {
                  console.error('Erro no upload do currículo:', err);
                  alert('Erro no upload do currículo: ' + String(err));
                }
              }}
            />

            <CampoArquivoAnexo
              id="certificados"
              label="Certificados (PDF/JPG)"
              accept=".pdf,.jpg,.jpeg,.png"
              value={formData.certificados}
              textoBotaoVazio="Selecionar certificados"
              onFileSelect={async (file) => {
                const url = await uploadFile(file, 'certificados');
                if (url) setFormData((prev) => ({ ...prev, certificados: url }));
              }}
            />

            <CampoArquivoAnexo
              id="atestado"
              label="Atestado de antecedentes"
              accept=".pdf,.jpg,.png"
              value={formData.atestado}
              textoBotaoVazio="Selecionar atestado"
              onFileSelect={async (file) => {
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('type', 'documents');
                  const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
                  const data = await res.json();
                  if (res.ok && data.success && data.file?.url) {
                    setFormData((prev) => ({ ...prev, atestado: data.file.url }));
                  } else if (res.status === 401) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData((prev) => ({ ...prev, atestado: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  } else {
                    console.error('Upload atestado falhou', data);
                    alert('Erro ao enviar atestado');
                  }
                } catch (err) {
                  console.error('Erro no upload do atestado:', err);
                  alert('Erro no upload do atestado: ' + String(err));
                }
              }}
            />

          </section>

          <section>
            <h2 className={styles.sectionTitle}>Termos</h2>
            
            <label className={styles.checkboxLabel}>
              <input type="checkbox" required /> Autorizo o uso dos meus dados
            </label>

            <label className={styles.checkboxLabel}>
              <input type="checkbox" required /> Declaro que as informações são verdadeiras
            </label>
          </section>

          <button type="submit" className={styles.submitBtn}>
            {isEditMode ? 'Salvar alterações' : 'Finalizar meu cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}