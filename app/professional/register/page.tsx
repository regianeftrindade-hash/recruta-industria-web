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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { signIn, signOut, useSession, getSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { safeJobReturnPath } from '@/lib/jobs/public-job-link';
import styles from './register.module.css';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { isValidEmail, sanitizeInput } from '../../../lib/security';
import { t } from '@/lib/i18n/translate';
import { rotuloOpcao } from '@/lib/i18n/option-label';
import RegistrationCountryField from '@/components/identity/RegistrationCountryField';
import {
  buildFormEditForLoad,
} from '../../../lib/professional-profile-map';
import ProfileCompletionBar from '@/app/components/ProfileCompletionBar';
import RegisterSectionHeader from '@/app/components/RegisterSectionHeader';
import { LabelMarcador, TextoMarcador } from './RegisterLabelMarcador';
import RegisterTermoItem from './RegisterTermoItem';
import RegisterSobreMimFields from './RegisterSobreMimFields';
import { SOBRE_MIM_VAZIO, truncarSobreMim, type SobreMimData } from '@/lib/sobre-mim';
import { validarCamposObrigatoriosCadastro, validarCamposObrigatoriosEtapa, type CampoObrigatorioFalta, type ValidacaoCadastroInput } from '@/lib/professional/cadastro-obrigatorios';
import { useCampoObrigatorioErro } from './useCampoObrigatorioErro';
import RegisterExtendedSections from './RegisterExtendedSections';
import { focarCampoCadastro } from '@/lib/ui/focar-campo-cadastro';
import RegisterWizardChrome, { REGISTER_WIZARD_STEPS } from './RegisterWizardChrome';
import RegisterCollapsibleSection from '@/components/ui/RegisterCollapsibleSection';
import ResumeToolkit from '@/components/curriculum/ResumeToolkit';
import { sanitizeResumeDraft, type ResumeDraft } from '@/lib/curriculum/resume-draft';
import { buildResumeFormApplyPatch, matchCidadeIbge } from '@/lib/curriculum/apply-resume-to-form';
import { parseResumePatterns } from '@/lib/curriculum/parse-resume-patterns';
import { CurriculoAnexadoSemLeituraError, requestResumeExtract } from '@/lib/curriculum/resume-read-error';
import PageLoader from '@/app/components/PageLoader';
import {
  calculateProfileCompletion,
  PREFIRO_NAO_INFORMAR,
  ESCOLARIDADES_OPCOES,
  CNH_CATEGORIAS,
  CURSOS_INDUSTRIAIS_SUGERIDOS,
  IDIOMAS_OPCOES,
  NIVEIS_OPERACIONAIS,
  AREAS_COMPLEMENTO_NIVEL,
  SEGMENTOS_INDUSTRIA,
  normalizeCursoDetalhado,
  normalizeCertificacaoDetalhada,
  parseCursosDetalhados,
  parseCertificacoesDetalhadas,
  parseIdiomasDetalhados,
  serializeIdioma,
  buildCargoDesejado,
  collectSegmentosIndustria,
  type CursoDetalhado,
  type CertificacaoDetalhada,
  type IdiomaEntry,
} from '@/lib/professional-form-config';
import { isArquivoAnexado, isArquivoNoServidor, nomeArquivoAnexado } from '@/lib/arquivo-anexo';
import CertificadoCursoUpload from '@/components/professional/CertificadoCursoUpload';
import VideoApresentacaoCadastro from '@/components/professional/VideoApresentacaoCadastro';
import { AuthAtmosphere } from '@/components/shared/AuthAtmosphere';
import LogoRecruta from '@/app/components/LogoRecruta';
import { reportProfessionalSignupConversion } from '@/lib/analytics/google-ads';
import type { ResumeStructuredFields } from '@/lib/curriculum/types';
import { caminhoFotoPerfil, fotoPerfilSrc } from '@/lib/professional/foto-perfil';

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

function contarCamposPreenchidos(dados: Record<string, unknown>): number {
  return Object.values(dados).filter((v) => {
    if (v == null || v === false) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) {
      return v.some((item) => {
        if (typeof item === 'string') return item.trim().length > 0;
        if (item && typeof item === 'object') {
          return Object.values(item as Record<string, unknown>).some((x) => String(x || '').trim());
        }
        return false;
      });
    }
    return true;
  }).length;
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
  'documentoFormacao',
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

function arquivoFotoPermitido(file: File): boolean {
  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

function arquivoFotoComTipo(file: File): File {
  if (file.type) return file;
  const nome = file.name.toLowerCase();
  const type = nome.endsWith('.png')
    ? 'image/png'
    : nome.endsWith('.webp')
      ? 'image/webp'
      : nome.endsWith('.gif')
        ? 'image/gif'
        : nome.endsWith('.jpg') || nome.endsWith('.jpeg')
          ? 'image/jpeg'
          : '';
  return type ? new File([file], file.name, { type }) : file;
}

function lerImagemComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(t("registration.ui.nao-foi-possivel-ler-a-imagem")));
    reader.readAsDataURL(file);
  });
}

function parseJsonSafe(res: Response): Promise<Record<string, unknown>> {
  return res.text().then((text) => {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(t("registration.ui.resposta-invalida-do-servidor-atualize-a-pagina-e-tente-novament"));
    }
  });
}

function LegendaPreenchimento({ avisoSalvar = false }: { avisoSalvar?: boolean }) {
  return (
    <div>
      <div className={styles.legendaPreenchimentoCard}>
        <h3 className={styles.legendaPreenchimentoTitulo}>{t("registration.ui.preenchimento")}</h3>
        <div className={styles.legendaPreenchimentoLista}>
          <div className={styles.legendaPreenchimentoItem}>
            <span className={`${styles.legendaBolinha} ${styles.legendaBolinhaVermelha}`} aria-hidden />
            <span>{t("registration.ui.preenchimento-obrigatorio")}</span>
          </div>
          <div className={styles.legendaPreenchimentoItem}>
            <span className={`${styles.legendaBolinha} ${styles.legendaBolinhaAmarela}`} aria-hidden />
            <span>{t("registration.ui.preenchimento-recomendado")}</span>
          </div>
        </div>
      </div>
      {avisoSalvar ? (
        <p className={styles.avisoSalvarTag}>
          {t("registration.ui.dados-carregados-salvar")}
        </p>
      ) : null}
    </div>
  );
}

function CampoFotoPerfil({
  value,
  onFileSelect,
  centered = false,
  avisoSalvar = false,
}: {
  value: string | null;
  onFileSelect: (file: File) => Promise<void> | void;
  centered?: boolean;
  avisoSalvar?: boolean;
}) {
  const [erro, setErro] = useState('');
  const fotoSrc = fotoPerfilSrc(value);
  const temFoto = Boolean(fotoSrc);

  const inputFoto = (
    <input
      id="fotoPerfil"
      className={styles.fotoInput}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setErro('');
        try {
          await onFileSelect(file);
        } catch (err) {
          setErro(err instanceof Error ? err.message : t("registration.ui.nao-foi-possivel-usar-esta-foto"));
        }
      }}
    />
  );

  return (
    <div className={`${styles.fotoCampo} ${centered ? styles.fotoCampoCentro : ''}`}>
      <TextoMarcador marcador="recomendado">{t("registration.ui.foto-de-perfil")}</TextoMarcador>
      {temFoto && (
        <div className={styles.fotoComAnexo}>
          <img
            src={fotoSrc}
            alt={t("registration.ui.foto-de-perfil")}
            className={styles.avatarPreview}
            decoding="async"
          />
          <div className={styles.fotoAnexoLinha}>
            <span className={styles.anexoTextoInline}>{t("registration.ui.foto-de-perfil-anexada")}</span>
            <label className={`${styles.anexoBtn} ${styles.fotoLabelBtn}`}>
              {t("registration.ui.trocar-foto")}
              {inputFoto}
            </label>
          </div>
          {centered && <LegendaPreenchimento avisoSalvar={avisoSalvar} />}
        </div>
      )}
      {!temFoto && (
        <div className={centered ? styles.fotoComAnexo : undefined}>
          <div className={centered ? styles.fotoAnexoLinha : styles.anexoBtnRow}>
            <label className={`${styles.anexoBtn} ${styles.fotoLabelBtn}`}>
              {t("registration.ui.selecionar-foto")}
              {inputFoto}
            </label>
          </div>
          {centered && <LegendaPreenchimento avisoSalvar={avisoSalvar} />}
        </div>
      )}
      {erro ? <p className={styles.anexoCurriculoErro} role="alert">{erro}</p> : null}
    </div>
  );
}

function AnexoCurriculoAutomatico({
  onFile,
}: {
  onFile: (file: File) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const [nome, setNome] = useState('');
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');

  return (
    <section className={styles.anexoCurriculoCard} aria-label={t("registration.ui.anexar-curriculo")}>
      <p className={styles.anexoCurriculoAviso}>
        {t("registration.ui.anexe-pdf")}
      </p>
      <label className={`${styles.anexoBtn} ${styles.fotoLabelBtn}`}>
        {busy ? t("registration.ui.lendo-curriculo") : nome ? t("registration.ui.trocar-curriculo") : t("registration.ui.anexar-pdf-ou-docx")}
        <input
          className={styles.fotoInput}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setBusy(true);
            setErro('');
            setAviso('');
            try {
              const mensagem = await onFile(file);
              setNome(file.name);
              setAviso(mensagem);
            } catch (err) {
              if (err instanceof CurriculoAnexadoSemLeituraError) setNome(file.name);
              setErro(err instanceof Error ? err.message : t("registration.ui.nao-foi-possivel-ler-o-curriculo"));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {nome ? <p className={styles.anexoCurriculoNome}>{nome}</p> : null}
      {aviso ? <p className={styles.anexoCurriculoNome} role="status">{aviso}</p> : null}
      {erro ? <p className={styles.anexoCurriculoErro} role="alert">{erro}</p> : null}
    </section>
  );
}

function CampoArquivoAnexo({
  id,
  label,
  accept,
  value,
  onFileSelect,
  textoBotaoVazio = t("registration.ui.selecionar-arquivo"),
  textoBotaoInline = t("registration.ui.anexar"),
  formatosAceitos,
  comCard = false,
  somenteLabelEBotao = false,
  layoutInline = false,
}: {
  id: string;
  label?: string;
  accept: string;
  value: string | null;
  onFileSelect: (file: File) => Promise<void> | void;
  textoBotaoVazio?: string;
  textoBotaoInline?: string;
  formatosAceitos?: string;
  comCard?: boolean;
  somenteLabelEBotao?: boolean;
  layoutInline?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nomeArquivoLocal, setNomeArquivoLocal] = useState<string | null>(null);
  const anexado = isArquivoAnexado(value);
  const noServidor = !!value && isArquivoNoServidor(value);
  const nomeExibido = anexado
    ? (nomeArquivoLocal || nomeArquivoAnexado(value!))
    : null;

  useEffect(() => {
    if (!anexado) setNomeArquivoLocal(null);
  }, [anexado, value]);

  return (
    <div className={`${styles.anexoCampo} ${comCard ? styles.anexoCard : ''}`}>
      {label ? <span className={styles.label}>{label}</span> : null}
      {formatosAceitos ? (
        <p className={styles.anexoFormatosHint}>{t("registration.ui.somente-formatos").replace("{formatos}", formatosAceitos)}</p>
      ) : null}
      {layoutInline ? (
        <div className={styles.anexoCampoInline}>
          <div className={styles.anexoCampoInput} aria-live="polite">
            {anexado ? (
              <span className={styles.anexoCampoNome} title={nomeExibido ?? undefined}>
                {noServidor ? '✓ ' : '⚠ '}
                {nomeExibido}
              </span>
            ) : (
              <span className={styles.anexoCampoPlaceholder}>{t("registration.ui.nenhum-arquivo-anexado")}</span>
            )}
          </div>
          <button
            type="button"
            className={styles.anexoCampoBtn}
            onClick={() => inputRef.current?.click()}
          >
            {anexado ? t("registration.ui.trocar") : textoBotaoInline}
          </button>
        </div>
      ) : anexado ? (
        somenteLabelEBotao ? (
          <div className={styles.anexoActions}>
            <a
              href={value!}
              download
              target="_blank"
              rel="noopener noreferrer"
              className={styles.anexoBtn}
            >
              {t("registration.ui.download")}
            </a>
          </div>
        ) : (
        <div className={styles.anexoBox}>
          <p className={styles.anexoTexto}>
            {noServidor ? t("registration.ui.arquivo-anexado") : t("registration.ui.rascunho-local-sera-enviado-ao-salvar")}{' '}
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
                {t("registration.ui.download")}
              </a>
            )}
            <button type="button" className={styles.anexoBtn} onClick={() => inputRef.current?.click()}>
              {t("registration.ui.trocar-arquivo")}
            </button>
          </div>
        </div>
        )
      ) : (
        <div className={styles.anexoBtnRow}>
          <button type="button" className={styles.anexoBtn} onClick={() => inputRef.current?.click()}>
            {textoBotaoVazio}
          </button>
        </div>
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
          setNomeArquivoLocal(file.name);
          await onFileSelect(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function BlocoCadastro({
  emoji,
  title,
  editavel,
  aberto,
  onEditar,
  children,
}: {
  emoji: string;
  title: string;
  editavel: boolean;
  aberto: boolean;
  onEditar: () => void;
  children: React.ReactNode;
}) {
  const travado = editavel && !aberto;
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHead}>
        <RegisterSectionHeader emoji={emoji} title={title} />
        {editavel ? (
          <button
            type="button"
            className={styles.blocoEditarBtn}
            onClick={onEditar}
            disabled={aberto}
          >
            {aberto ? t("registration.ui.editando") : t("registration.ui.editar")}
          </button>
        ) : null}
      </div>
      <div inert={travado ? true : undefined} className={travado ? styles.cadastroTravado : undefined}>
        {children}
      </div>
    </section>
  );
}

export default function CadastroProfissional({
  incorporado = false,
  travado = false,
  onSalvo,
  acoes,
}: {
  incorporado?: boolean;
  travado?: boolean;
  onSalvo?: () => void;
  acoes?: React.ReactNode;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const isEditMode = incorporado || searchParams.get('edit') === '1';
  const destinoDepoisDoCadastro = () =>
    safeJobReturnPath(searchParams.get('redirect')) || '/professional/boas-vindas';
  const [profileLoaded, setProfileLoaded] = useState(!isEditMode);
  /** Só bloqueia a tela quando há sessão autenticada para checar. Visitante vê o form na hora. */
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  /** Sessão ativa com cadastro já completo — não redireciona em silêncio. */
  const [contaJaCompleta, setContaJaCompleta] = useState(false);
  const [sessionWaitTimedOut, setSessionWaitTimedOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [salvoNoBotao, setSalvoNoBotao] = useState(false);
  const [blocosAbertos, setBlocosAbertos] = useState<Record<string, boolean>>({});
  const abrirBloco = (id: string) => {
    setBlocosAbertos((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };
  const propsBloco = (id: string, emoji: string, title: string) => ({
    emoji,
    title,
    editavel: isEditMode,
    aberto: Boolean(blocosAbertos[id]),
    onEditar: () => abrirBloco(id),
  });
  const [camposObrigatoriosFaltando, setCamposObrigatoriosFaltando] = useState<CampoObrigatorioFalta[]>([]);
  const { fg, blocoErro, termoErro } = useCampoObrigatorioErro(camposObrigatoriosFaltando);
  const [pais, setPais] = useState('BR');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailRepetido, setEmailRepetido] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [formFeedback, setFormFeedback] = useState<{ tone: 'error' | 'success'; message: string } | null>(null);
  const [cpf, setCpf] = useState('');
  const [senhaPreenchida, setSenhaPreenchida] = useState(false); // Rastreia se senha foi carregada do localStorage
  const [telefone, setTelefone] = useState('');
  const [telefone2, setTelefone2] = useState('');
  const [pretensaoSalarial, setPretensaoSalarial] = useState('');
  const [cursos, setCursos] = useState<CursoDetalhado[]>([{ nome: '', possuiCertificado: false }]);
  const [certificacoes, setCertificacoes] = useState<CertificacaoDetalhada[]>([{ nome: '' }]);
  const [idiomas, setIdiomas] = useState<IdiomaEntry[]>([{ selecionado: '' }]);
  const [dataNascimentoValue, setDataNascimentoValue] = useState('');
  const [empresas, setEmpresas] = useState<{ nome: string; cargo: string; segmento: string; dataInicio: string; dataFim: string; descricao: string }[]>([
    { nome: '', cargo: '', segmento: '', dataInicio: '', dataFim: '', descricao: '' }
  ]);
  const [sobreMim, setSobreMim] = useState<SobreMimData>(SOBRE_MIM_VAZIO);
  const [wizardStep, setWizardStep] = useState(0);
  // Cadastro público e aba Perfil: a lista inteira, com rolagem. Sem etapas.
  const useWizard = false;
  const showWizardStep = (n: number) => !useWizard || wizardStep === n;
  const lastWizardStep = REGISTER_WIZARD_STEPS.length - 1;

  const [formData, setFormData] = useState({
    nome: '', dataNascimento: '', idade: '', sexoBiologico: '', identidadeGenero: '', orientacaoSexual: '', estadoCivil: '', religiao: '', antecedentes: '',
    possuiFilhos: t("registration.ui.nao"), quantidadeFilhos: '', faixaEtariaFilhos: [] as string[],
    email: '', telefone: '', telefone2: '', whatsapp: t("registration.ui.nao"),
    estado: '', cidade: '', disponibilidadeMudanca: '',
    escolaridade: '', cursoFormacao: '', instituicaoFormacao: '', anoConclusaoFormacao: '', documentoFormacao: null as string | null, possuiCertificadoFormacao: false, cursosCertificacoes: '',
    situacaoProfissional: '', areaInteresse: '', cargoDesejado: '', nivelOperacional: '', areaNivel: '', detalheNivel: '', turnoDisponivel: '', disponibilidadeInicio: '',
    trabalhouIndustria: t("registration.ui.nao"), tempoExperiencia: '', experiencias: '',
    recolocacao: '', pretensaoSalarial: '',
    maquinasEquipamentos: [] as string[], qualidadeProcessos: [] as string[],
    informatica: [] as string[], possuiCNH: '', categoriaCNH: '',
    aceitaViagens: '', disponivelContratacao: '',
    certificados: null as string | null, cnhDocumento: null as string | null,
    fotoPerfil: null as string | null, curriculo: null as string | null, atestado: null as string | null, possuiAtestadoAntecedentes: false,
    mensagemEmpresas: '',
    autorizoDados: false, declaroVerdadeiro: false, aceitoLGPD: false
  });

  const [cidades, setCidades] = useState<string[]>([]);
  const listaEstados = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  /** Cidade vinda do currículo — aplica quando a lista IBGE do estado carregar. */
  const pendingCidadeImportRef = useRef<string | null>(null);
  const pendingResumeRef = useRef<File | null>(null);
  /** Impede que um reload da sessão ou do perfil apague o que o currículo acabou de preencher. */
  const curriculoImportadoRef = useRef(false);
  const hidratacaoEmailRef = useRef<string | null>(null);
  const checagemCadastroFeitaRef = useRef(false);

  const aplicarDadosDoPerfil = (formEdit: {
    formData: Record<string, unknown>;
    cpf: string;
    telefone: string;
    telefone2: string;
    pretensaoSalarial: string;
    dataNascimentoDisplay: string;
    cursos: string[];
    cursosDetalhados?: CursoDetalhado[];
    empresas: { nome: string; cargo: string; segmento?: string; dataInicio: string; dataFim: string; descricao?: string }[];
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
      cursoFormacao: String(dadosForm.cursoFormacao ?? prev.cursoFormacao),
      instituicaoFormacao: String(dadosForm.instituicaoFormacao ?? prev.instituicaoFormacao),
      anoConclusaoFormacao: String(dadosForm.anoConclusaoFormacao ?? prev.anoConclusaoFormacao),
      documentoFormacao: (dadosForm.documentoFormacao as string | null) ?? prev.documentoFormacao,
      possuiCertificadoFormacao: Boolean(dadosForm.documentoFormacao) || prev.possuiCertificadoFormacao,
      cursosCertificacoes: String(dadosForm.cursosCertificacoes ?? prev.cursosCertificacoes),
      situacaoProfissional: dadosForm.situacaoProfissional != null && dadosForm.situacaoProfissional !== ''
        ? String(dadosForm.situacaoProfissional)
        : prev.situacaoProfissional,
      areaInteresse: dadosForm.areaInteresse != null && dadosForm.areaInteresse !== ''
        ? String(dadosForm.areaInteresse)
        : prev.areaInteresse,
      cargoDesejado: String(dadosForm.cargoDesejado ?? prev.cargoDesejado),
      nivelOperacional: String(dadosForm.nivelOperacional ?? prev.nivelOperacional),
      areaNivel: String(dadosForm.areaNivel ?? prev.areaNivel),
      detalheNivel: String(dadosForm.detalheNivel ?? prev.detalheNivel),
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
      possuiAtestadoAntecedentes: Boolean(dadosForm.atestado) || prev.possuiAtestadoAntecedentes,
      mensagemEmpresas: String(dadosForm.mensagemEmpresas ?? prev.mensagemEmpresas),
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
      aceitoLGPD: dadosForm.aceitoLGPD === true || prev.aceitoLGPD,
    }));

    setCpf(formEdit.cpf || '');
    setTelefone(formEdit.telefone || String(dadosForm.telefone || ''));
    setTelefone2(formEdit.telefone2 || String(dadosForm.telefone2 || ''));
    setPretensaoSalarial(formEdit.pretensaoSalarial || String(dadosForm.pretensaoSalarial || ''));
    setDataNascimentoValue(formEdit.dataNascimentoDisplay || '');
    const cursosCarregados = parseCursosDetalhados(
      formEdit.cursosDetalhados ?? formEdit.cursos,
    );
    setCursos(cursosCarregados.length ? cursosCarregados : [{ nome: '', possuiCertificado: false }]);
    const certsCarregados = parseCertificacoesDetalhadas(
      dadosForm.certificacoesDetalhadas ?? dadosForm.certificacoes,
    );
    setCertificacoes(certsCarregados.length ? certsCarregados : [{ nome: '' }]);
    const idiomasCarregados = parseIdiomasDetalhados(dadosForm.idiomasDetalhados ?? dadosForm.idiomas);
    setIdiomas(idiomasCarregados.length ? idiomasCarregados : [{ selecionado: '' }]);
    setEmpresas(
      formEdit.empresas?.length
        ? formEdit.empresas.map((e) => ({
            nome: e.nome || '',
            cargo: e.cargo || '',
            segmento: e.segmento || '',
            dataInicio: e.dataInicio || '',
            dataFim: e.dataFim || '',
            descricao: e.descricao || '',
          }))
        : [{ nome: '', cargo: '', segmento: '', dataInicio: '', dataFim: '', descricao: '' }]
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

    try {
      const existenteRaw = localStorage.getItem(keyForm);
      if (existenteRaw) {
        const existente = JSON.parse(existenteRaw) as Record<string, unknown>;
        if (contarCamposPreenchidos(existente) > contarCamposPreenchidos(payload) + 2) {
          return;
        }
      }
    } catch {
      /* segue com o save */
    }

    const ok =
      tentarSalvarLocal(keyForm, payload)
      || tentarSalvarLocal(keyForm, {
        ...payload,
        fotoPerfil: null,
        curriculo: null,
        atestado: null,
        certificados: null,
        cnhDocumento: null,
        documentoFormacao: null,
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
        if (!res.ok) throw new Error(t("registration.ui.nao-foi-possivel-carregar-o-perfil"));
        return res.json();
      })
      .then((data) => {
        if (curriculoImportadoRef.current) {
          return fetch('/api/professional/sobre-mim', { credentials: 'include' });
        }
        if (data.formEdit) {
          aplicarDadosDoPerfil(data.formEdit);
        } else if (data.email) {
          setFormData((prev) => ({
            ...prev,
            email: data.email || prev.email,
            nome: data.nome && data.nome !== t("registration.ui.usuario") ? data.nome : prev.nome,
          }));
        }

        return fetch('/api/professional/sobre-mim', { credentials: 'include' });
      })
      .then((sobreRes) => {
        if (!sobreRes?.ok) return null;
        return sobreRes.json();
      })
      .then((sobreData) => {
        if (sobreData?.sobreMim) setSobreMim(sobreData.sobreMim);
      })
      .catch((err) => {
        console.error('Erro ao carregar perfil para edição:', err);
        if (!incorporado) {
          alert(t("registration.ui.nao-foi-possivel-carregar-seus-dados-tente-novamente-pelo-painel"));
          router.push('/professional/dashboard');
        }
      })
      .finally(() => {
        setProfileLoaded(true);
      });
  }, [isEditMode, incorporado, router]);

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
      return;
    }
    if (curriculoImportadoRef.current || hidratacaoEmailRef.current === emailSessao) {
      setProfileLoaded(true);
      return;
    }
    hidratacaoEmailRef.current = emailSessao;

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
        const cursosCarregados = parseCursosDetalhados(dados.cursos);
        if (cursosCarregados.length > 0) setCursos(cursosCarregados);
      }
      if (Array.isArray(dados.empresas) && dados.empresas.length > 0) {
        setEmpresas(dados.empresas as typeof empresas);
      }
      if (dados.sobreMim && typeof dados.sobreMim === 'object') {
        setSobreMim({
          ...SOBRE_MIM_VAZIO,
          ...(dados.sobreMim as Partial<SobreMimData>),
        });
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

  // Sessão Google: preenche dados básicos. Cadastro já completo volta à vaga ou ao painel.
  useEffect(() => {
    if (isEditMode) return;

    if (sessionStatus === 'unauthenticated') {
      setCheckingRegistration(false);
      setContaJaCompleta(false);
      return;
    }

    if (sessionStatus !== 'authenticated' || !session?.user) return;

    const userType = (session.user as { userType?: string }).userType?.toUpperCase();
    if (userType === 'COMPANY') {
      router.replace('/company/register');
      return;
    }

    if (checagemCadastroFeitaRef.current || curriculoImportadoRef.current) return;

    setSenhaPreenchida(true);
    setPassword('');
    setConfirmPassword('');
    setCheckingRegistration(true);
    setContaJaCompleta(false);

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setCheckingRegistration(false);
    }, 8000);

    fetch('/api/professional/profile', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || curriculoImportadoRef.current) return;
        if (data?.registrationComplete) {
          setContaJaCompleta(true);
          const volta = safeJobReturnPath(searchParams.get('redirect'));
          router.replace(volta || '/professional/dashboard');
          return;
        }

        if (data?.formEdit) {
          aplicarDadosDoPerfil(data.formEdit);
        }

          setFormData((prev) => ({
          ...prev,
          email: session.user?.email || prev.email,
          nome: String(prev.nome || '').trim()
            ? prev.nome
            : (data?.nome && data.nome !== t("registration.ui.usuario")
                ? data.nome
                : session.user?.name || prev.nome),
        }));
        setSenhaPreenchida(true);
      })
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (!cancelled) {
          checagemCadastroFeitaRef.current = true;
          setCheckingRegistration(false);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isEditMode, sessionStatus, session, router]);

  useEffect(() => {
    if (sessionStatus !== 'loading') {
      setSessionWaitTimedOut(false);
      return;
    }
    const t = window.setTimeout(() => setSessionWaitTimedOut(true), 5000);
    return () => window.clearTimeout(t);
  }, [sessionStatus]);
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
          sobreMim,
        };
        salvarBackupLocal(dadosParaSalvar);
      }
    }
  }, [formData, cpf, dataNascimentoValue, telefone, telefone2, pretensaoSalarial, cursos, certificacoes, idiomas, empresas, sobreMim, profileLoaded, isEditMode]);

  const atualizarSobreMim = (campo: keyof SobreMimData, val: string) => {
    setSobreMim((prev) => truncarSobreMim({ ...prev, [campo]: val }));
  };

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
    const salarioFormatado = t("registration.ui.r") + inteiroFormatado + ',' + centavos;
    setPretensaoSalarial(salarioFormatado);
    setFormData((prev) => ({ ...prev, pretensaoSalarial: salarioFormatado }));
  };

  const completionPercent = calculateProfileCompletion({
    ...formData,
    telefone,
    telefone2,
    pretensaoSalarial,
    dataNascimentoDisplay: dataNascimentoValue,
    cursos: cursos.map((c) => c.nome).filter((n) => n.trim()),
    certificacoes: certificacoes.map((c) => c.nome).filter((n) => n.trim()),
    idiomas: idiomas.map(serializeIdioma).filter(Boolean),
    empresas,
  });

  const cadastroComGoogle = sessionStatus === 'authenticated' && !!session?.user?.email;
  const exibirCamposSenha = !isEditMode && !cadastroComGoogle;

  const montarInputValidacao = useCallback((): ValidacaoCadastroInput => ({
    nome: formData.nome,
    cpf,
    cpfError: '',
    dataNascimentoValue,
    dataNascimento: formData.dataNascimento,
    sexoBiologico: formData.sexoBiologico,
    estadoCivil: formData.estadoCivil,
    possuiCNH: formData.possuiCNH,
    categoriaCNH: formData.categoriaCNH,
    antecedentes: formData.antecedentes,
    email: formData.email,
    telefone,
    telefone2,
    whatsapp: formData.whatsapp,
    estado: formData.estado,
    cidade: formData.cidade,
    disponibilidadeMudanca: formData.disponibilidadeMudanca,
    aceitaViagens: formData.aceitaViagens,
    escolaridade: formData.escolaridade,
    cursoFormacao: formData.cursoFormacao,
    anoConclusaoFormacao: formData.anoConclusaoFormacao,
    situacaoProfissional: formData.situacaoProfissional,
    areaInteresse: formData.areaInteresse,
    nivelOperacional: formData.nivelOperacional,
    cargoDesejado: formData.cargoDesejado,
    areaNivel: formData.areaNivel,
    detalheNivel: formData.detalheNivel,
    turnoDisponivel: formData.turnoDisponivel,
    disponibilidadeInicio: formData.disponibilidadeInicio,
    pretensaoSalarial,
    trabalhouIndustria: formData.trabalhouIndustria,
    empresas,
    autorizoDados: formData.autorizoDados,
    declaroVerdadeiro: formData.declaroVerdadeiro,
    aceitoLGPD: formData.aceitoLGPD,
    exigeSenha: !isEditMode && !cadastroComGoogle,
    password,
    confirmPassword,
    countryCode: pais,
  }), [
    formData,
    cpf,
    dataNascimentoValue,
    telefone,
    telefone2,
    pais,
    pretensaoSalarial,
    empresas,
    password,
    confirmPassword,
    isEditMode,
    cadastroComGoogle,
  ]);

  useEffect(() => {
    if (camposObrigatoriosFaltando.length === 0) return;

    const faltando = useWizard
      ? validarCamposObrigatoriosEtapa(montarInputValidacao(), wizardStep)
      : validarCamposObrigatoriosCadastro(montarInputValidacao());
    setCamposObrigatoriosFaltando(faltando);

    if (formData.email && isValidEmail(formData.email)) {
      setEmailError('');
    }
  }, [montarInputValidacao, camposObrigatoriosFaltando.length, useWizard, wizardStep, formData.email]);

  const tentarAvancarWizard = (): boolean => {
    const faltando = validarCamposObrigatoriosEtapa(montarInputValidacao(), wizardStep);
    setCamposObrigatoriosFaltando(faltando);
    if (faltando.length > 0) {
      window.setTimeout(() => {
        const primeiro = faltando[0]?.id;
        if (primeiro) focarCampoCadastro(primeiro);
        else document.getElementById('aviso-obrigatorios')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
      return false;
    }
    setCamposObrigatoriosFaltando([]);
    return true;
  };

  const irWizard = (target: number) => {
    if (target === wizardStep) return;
    if (target < wizardStep) {
      setWizardStep(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (target > wizardStep + 1) return;
    if (!tentarAvancarWizard()) return;
    setWizardStep(Math.min(lastWizardStep, wizardStep + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
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

  // Carrega cidades a partir do estado selecionado (e aplica cidade pendente do currículo)
  useEffect(() => {
    if (!formData.estado) {
      setCidades([]);
      return;
    }
    let cancelled = false;
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.estado}/municipios`)
      .then((res) => res.json())
      .then((data: Array<{ nome: string }>) => {
        if (cancelled) return;
        const lista = (data || []).map((c) => c.nome).sort();
        const pending = pendingCidadeImportRef.current;
        let listaFinal = lista;
        let cidadeFinal: string | null = null;
        if (pending) {
          const matched = matchCidadeIbge(pending, lista);
          pendingCidadeImportRef.current = null;
          cidadeFinal = matched || pending;
          if (!matched && !lista.includes(pending)) listaFinal = [pending, ...lista];
        }
        setCidades(listaFinal);
        if (cidadeFinal) {
          setFormData((prev) =>
            prev.estado === formData.estado ? { ...prev, cidade: cidadeFinal as string } : prev,
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        const pending = pendingCidadeImportRef.current;
        if (!pending) return;
        pendingCidadeImportRef.current = null;
        setCidades((prev) => (prev.includes(pending) ? prev : [pending, ...prev]));
        setFormData((prev) => (
          prev.estado === formData.estado && !prev.cidade ? { ...prev, cidade: pending } : prev
        ));
      });
    return () => {
      cancelled = true;
    };
  }, [formData.estado]);

  async function enviarCurriculoPendente(): Promise<string | null> {
    const file = pendingResumeRef.current;
    if (!file) return null;
    const body = new FormData();
    body.set("file", file);
    body.set("type", "curriculos");
    const uploaded = await fetch("/api/upload", { method: "POST", body, credentials: "include" });
    const uploadData = await uploaded.json().catch(() => ({}));
    if (!uploaded.ok || !uploadData?.file?.path) {
      return uploadData?.error || t("registration.ui.nao-foi-possivel-enviar-o-curriculo-a-conta-foi-mantida-e-o-arqu");
    }
    const saved = await fetch("/api/professional/curriculo", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: uploadData.file.path }),
    });
    const savedData = await saved.json().catch(() => ({}));
    if (!saved.ok) {
      return savedData?.error || t("registration.ui.nao-foi-possivel-associar-o-curriculo-ao-perfil-tente-de-novo-em");
    }
    pendingResumeRef.current = null;
    setFormData((prev) => ({ ...prev, curriculo: String(uploadData.file.path) }));
    return null;
  }

  const aplicarRascunhoCurriculo = (draft: ResumeDraft) => {
    setFormData((prev) => ({
      ...prev,
      nome: draft.nome,
      email: draft.email || prev.email,
      telefone: draft.telefone,
      cidade: draft.cidade,
      estado: draft.estado,
      cargoDesejado: draft.objetivo,
      mensagemEmpresas: draft.resumo,
      escolaridade: draft.escolaridade,
      cursoFormacao: draft.curso,
      instituicaoFormacao: draft.instituicao,
      anoConclusaoFormacao: draft.ano,
      categoriaCNH: draft.cnh,
      possuiCNH: draft.cnh ? "Sim" : prev.possuiCNH,
      maquinasEquipamentos: draft.habilidades,
      qualidadeProcessos: [],
      informatica: [],
    }));
    setTelefone(draft.telefone);
    setEmpresas(
      draft.experiencias.length
        ? draft.experiencias.map((item) => ({
          nome: item.empresa,
          cargo: item.cargo,
          segmento: item.segmento,
          dataInicio: item.inicio,
          dataFim: item.fim,
          descricao: item.atividades,
        }))
        : [{ nome: "", cargo: "", segmento: "", dataInicio: "", dataFim: "", descricao: "" }],
    );
    setCursos((prev) => {
      const next = draft.cursos.map((nome) => (
        prev.find((item) => item.nome === nome) || { nome, possuiCertificado: false }
      ));
      return next.length ? next : [{ nome: "", possuiCertificado: false }];
    });
    setIdiomas(draft.idiomas.length ? draft.idiomas.map((selecionado) => ({ selecionado })) : [{ selecionado: "" }]);
  };

  async function importarCurriculoArquivo(file: File): Promise<string> {
    const nome = file.name.toLowerCase();
    if (!nome.endsWith('.pdf') && !nome.endsWith('.docx')) {
      throw new Error(t("registration.ui.envie-um-arquivo-pdf-ou-docx"));
    }
    if (!file.size) throw new Error(t("registration.ui.o-arquivo-esta-vazio"));
    if (file.size > 8 * 1024 * 1024) throw new Error(t("registration.ui.arquivo-muito-grande-max-8mb"));

    const arquivoAnterior = pendingResumeRef.current;
    pendingResumeRef.current = file;
    let extraction;
    try {
      extraction = await requestResumeExtract(file);
    } catch (err) {
      if (!(err instanceof CurriculoAnexadoSemLeituraError)) {
        pendingResumeRef.current = arquivoAnterior;
      }
      throw err;
    }

    const doServidor = extraction.structured ?? null;
    let structured = doServidor;
    if (typeof extraction.rawText === 'string') {
      try {
        const lidoAgora = parseResumePatterns(extraction.rawText);
        const camposAgora = lidoAgora.matchedFields?.length || 0;
        const camposServidor = doServidor?.matchedFields?.length || 0;
        if (!doServidor || camposAgora >= camposServidor) structured = lidoAgora;
      } catch {
        structured = doServidor;
      }
    }
    const patch = buildResumeFormApplyPatch(
      structured,
      { formData, telefone, telefone2, empresas, cursos },
      { overwrite: false },
    );
    const formDataPatch: Record<string, unknown> = { ...patch.formDataPatch };
    if (patch.cidadePendente) {
      const bruta = patch.cidadePendente;
      pendingCidadeImportRef.current = bruta;
      const estadoNovo = typeof formDataPatch.estado === 'string' ? formDataPatch.estado : formData.estado;
      const matched = estadoNovo === formData.estado && cidades.length
        ? matchCidadeIbge(bruta, cidades)
        : null;
      if (matched) {
        pendingCidadeImportRef.current = null;
        formDataPatch.cidade = matched;
      } else {
        formDataPatch.cidade = bruta;
        setCidades((prev) => (prev.includes(bruta) ? prev : [bruta, ...prev]));
      }
    }

    if (patch.filledLabels.length || patch.preservados.length) curriculoImportadoRef.current = true;

    setFormData((prev) => ({
      ...prev,
      ...(formDataPatch as Partial<typeof prev>),
    }));
    if (patch.telefone) setTelefone(patch.telefone);
    if (patch.telefone2) setTelefone2(patch.telefone2);
    if (patch.dataNascimentoDisplay) setDataNascimentoValue(patch.dataNascimentoDisplay);
    if (patch.cursos?.length) setCursos(patch.cursos);
    if (patch.empresas?.length) setEmpresas(patch.empresas);
    if (typeof formDataPatch.email === 'string' && isValidEmail(formDataPatch.email)) {
      setEmailError('');
    }

    const avisoMantidos = patch.preservados.length
      ? t("registration.ui.curriculo-mantidos").replace("{lista}", patch.preservados.join(", "))
      : "";

    if (!patch.filledLabels.length) {
      if (patch.preservados.length) {
        return `${t("registration.ui.curriculo-lido")}${avisoMantidos} ${t("registration.ui.revise-campos")}`;
      }
      return t("registration.ui.arquivo-anexado-nao-encontramos-dados-para-preencher-complete-o-");
    }

    const etiquetas = patch.filledLabels.join(' ');
    const blocos: Record<string, boolean> = {};
    if (/Nome|Nascimento|Idade|CNH/.test(etiquetas)) blocos['dados-pessoais'] = true;
    if (/E-mail|Telefone|WhatsApp/.test(etiquetas)) blocos.contato = true;
    if (/Estado|Cidade/.test(etiquetas)) blocos.localizacao = true;
    if (/Escolaridade|Curso|Instituição|Ano|Cursos/.test(etiquetas)) blocos.formacao = true;
    if (/Experiências|Máquinas|Qualidade|Informática/.test(etiquetas)) blocos.experiencia = true;
    if (Object.keys(blocos).length) {
      setBlocosAbertos((prev) => ({ ...prev, ...blocos }));
      requestAnimationFrame(() => {
        document.getElementById('nome')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    return `Cadastro preenchido automaticamente: ${patch.filledLabels.join(', ')}.${avisoMantidos} Revise os campos e salve.`;
  }

  const montarRascunhoCurriculo = () => sanitizeResumeDraft({
    nome: formData.nome,
    cidade: formData.cidade,
    estado: formData.estado,
    telefone: telefone || formData.telefone,
    email: formData.email,
    objetivo: formData.cargoDesejado,
    resumo: formData.mensagemEmpresas,
    escolaridade: formData.escolaridade,
    curso: formData.cursoFormacao,
    instituicao: formData.instituicaoFormacao,
    ano: formData.anoConclusaoFormacao,
    experiencias: empresas.map((item) => ({
      empresa: item.nome,
      cargo: item.cargo,
      inicio: item.dataInicio,
      fim: item.dataFim,
      atividades: item.descricao,
      segmento: item.segmento,
    })),
    cursos: cursos.map((item) => item.nome),
    habilidades: [
      ...formData.maquinasEquipamentos,
      ...formData.qualidadeProcessos,
      ...formData.informatica,
    ],
    idiomas: idiomas.map((item) => serializeIdioma(item)),
    cnh: formData.possuiCNH === 'Sim' ? formData.categoriaCNH : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const liveSession = await getSession();
    const sessionEmail = liveSession?.user?.email?.toLowerCase().trim() || '';
    const formEmail = formData.email.toLowerCase().trim();
    const sessaoAtiva = emailsConferem(sessionEmail, formEmail);

    const faltando = validarCamposObrigatoriosCadastro(montarInputValidacao());

    if (faltando.length > 0) {
      setCamposObrigatoriosFaltando(faltando);
      if (!formData.email || !isValidEmail(formData.email)) {
        setEmailError(t("registration.ui.email-e-obrigatorio-e-deve-ser-valido"));
      }
      requestAnimationFrame(() => {
        focarCampoCadastro(faltando[0]?.id);
        if (!faltando[0]?.id || !document.getElementById(faltando[0].id)) {
          document.getElementById('aviso-obrigatorios')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      return;
    }

    setCamposObrigatoriosFaltando([]);
    setEmailError('');

    if (exibirCamposSenha) {
      const repetido = emailRepetido.toLowerCase().trim();
      if (!repetido || repetido !== formEmail) {
        setEmailError(t("registration.ui.repita-o-mesmo-e-mail-informado-no-cadastro"));
        requestAnimationFrame(() => {
          document.getElementById('emailRepetido')?.focus();
        });
        return;
      }
    }

    if (sessionEmail && formEmail && !sessaoAtiva) {
      alert(
        t("registration.ui.logado-outro-email")
          .replace("{sessionEmail}", sessionEmail)
          .replace("{formEmail}", formEmail),
      );
      return;
    }

    const cpfLimpo = pais === 'BR' ? cpf.replace(/\D/g, '') : '';

    const cargoDerivado = buildCargoDesejado({
      nivelOperacional: formData.nivelOperacional,
      areaNivel: formData.areaNivel,
      detalheNivel: formData.detalheNivel,
    });
    const segmentosDerivados = collectSegmentosIndustria(empresas);
    const idiomasSerializados = idiomas.map(serializeIdioma).filter(Boolean);

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
      cargoDesejado: formData.cargoDesejado.trim() || cargoDerivado,
      segmentosIndustria: segmentosDerivados,
      experiencias: empresas.filter((e) => e.nome.trim() || e.cargo.trim()),
      cursosCertificacoes: cursos.map((c) => c.nome).filter((n) => n.trim()),
      cursos: cursos.map((c) => c.nome).filter((n) => n.trim()),
      cursosDetalhados: cursos
        .map((c) => normalizeCursoDetalhado(c))
        .filter((c): c is CursoDetalhado => c !== null),
      certificacoes: certificacoes.map((c) => c.nome).filter((n) => n.trim()),
      certificacoesDetalhadas: certificacoes
        .map((c) => normalizeCertificacaoDetalhada(c))
        .filter((c): c is CertificacaoDetalhada => c !== null),
      idiomas: idiomasSerializados,
      idiomasDetalhados: idiomas.filter((i) => i.selecionado.trim()),
      empresas,
    };

    setSubmitting(true);
    if (isEditMode) setSalvoNoBotao(false);
    try {
      const salvarSobreMimPerfil = async () => {
        try {
          await fetch('/api/professional/sobre-mim', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sobreMim),
          });
        } catch (err) {
          console.error('Erro ao salvar sobre mim:', err);
        }
      };

      const finalizarPerfil = async (mensagemSucesso?: string) => {
        const profileRes = await fetch('/api/professional/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dadosParaSalvar),
        });

        const profileData = await parseJsonSafe(profileRes);

        if (profileRes.status === 401) {
          setFormFeedback({
            tone: 'error',
            message: t("registration.ui.sessao-expirada-entre-com-google-novamente-e-complete-o-cadastro"),
          });
          router.push('/login?tipo=profissional');
          return;
        }

        if (!profileRes.ok) {
          const detail = String(profileData.details || '').trim();
          const base = String(profileData.error || t("registration.ui.erro-ao-salvar-perfil"));
          throw new Error(detail ? `${base}: ${detail}` : base);
        }

        if (profileData.success) {
          const falhaCurriculo = await enviarCurriculoPendente();
          if (falhaCurriculo) {
            setFormFeedback({ tone: "error", message: falhaCurriculo });
            return;
          }
          await salvarSobreMimPerfil();
          salvarBackupLocal({
            ...dadosParaSalvar,
            sobreMim,
            dataNascimentoDisplay: dataNascimentoValue,
          });
          localStorage.removeItem('dadosCadastroSimples');
          if (isEditMode) {
            setSalvoNoBotao(true);
            setBlocosAbertos({});
            if (incorporado) onSalvo?.();
          } else {
            reportProfessionalSignupConversion();
            router.push(destinoDepoisDoCadastro());
          }
          return;
        }

        setFormFeedback({
          tone: 'error',
          message: t("registration.ui.erro-ao-salvar-perfil-2") + (profileData.error || t("registration.ui.desconhecido")),
        });
      };

      if (isEditMode) {
        await finalizarPerfil(t("registration.ui.cadastro-atualizado-com-sucesso-2"));
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
          countryCode: pais,
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
          data.error === t("registration.ui.email-ja-cadastrado") ||
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
            setFormFeedback({
              tone: 'error',
              message: String(data.error || t("registration.ui.conta-google-ja-cadastrada-faca-login-para-continuar")),
            });
            router.push('/login?tipo=profissional');
            return;
          }
          await finalizarPerfil();
          return;
        }
        throw new Error(String(data.error || t("registration.ui.erro-ao-registrar")));
      }

      if (data.completedExisting) {
        const falhaCurriculo = await enviarCurriculoPendente();
        if (falhaCurriculo) {
          setFormFeedback({ tone: "error", message: falhaCurriculo });
          return;
        }
        salvarBackupLocal({
          ...dadosParaSalvar,
          dataNascimentoDisplay: dataNascimentoValue,
        });
        localStorage.removeItem('dadosCadastroSimples');
        reportProfessionalSignupConversion();
        router.push(destinoDepoisDoCadastro());
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
          const falhaCurriculo = await enviarCurriculoPendente();
          if (falhaCurriculo) {
            setFormFeedback({ tone: "error", message: falhaCurriculo });
            return;
          }
          salvarBackupLocal({
            ...dadosParaSalvar,
            dataNascimentoDisplay: dataNascimentoValue,
          });
          localStorage.removeItem('dadosCadastroSimples');
          reportProfessionalSignupConversion();
          router.push(destinoDepoisDoCadastro());
          return;
        }

        salvarBackupLocal({
          ...dadosParaSalvar,
          dataNascimentoDisplay: dataNascimentoValue,
        });
        localStorage.removeItem('dadosCadastroSimples');
        reportProfessionalSignupConversion();
        setFormFeedback({
          tone: 'success',
          message:
            t("registration.ui.cadastro-realizado-nao-foi-possivel-entrar-automaticamente-use-o"),
        });
        return;
      }

      salvarBackupLocal({
        ...dadosParaSalvar,
        dataNascimentoDisplay: dataNascimentoValue,
      });
      localStorage.removeItem('dadosCadastroSimples');
      reportProfessionalSignupConversion();
      setFormFeedback({
        tone: 'success',
        message:
          t("registration.ui.cadastro-realizado-com-sucesso-entre-com-seu-e-mail-e-senha-para"),
      });

    } catch (err: any) {
      console.error('Erro no registro:', err);
      setFormFeedback({
        tone: 'error',
        message: err.message || t("registration.ui.erro-ao-conectar-ao-servidor"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const paginaCarregando =
    (sessionStatus === 'loading' && !sessionWaitTimedOut) ||
    (isEditMode && !profileLoaded) ||
    (sessionStatus === 'authenticated' && checkingRegistration);
  const mensagemCarregamento = !profileLoaded
    ? t("registration.ui.carregando-seus-dados")
    : checkingRegistration
      ? t("registration.ui.verificando-cadastro")
      : t("registration.ui.carregando");

  if (paginaCarregando || (!isEditMode && contaJaCompleta)) {
    const destinoContaPronta = safeJobReturnPath(searchParams.get('redirect'));
    return (
      <PageLoader
        message={
          contaJaCompleta
            ? (destinoContaPronta ? t("registration.ui.voltando-para-a-vaga") : t("registration.ui.abrindo-o-painel"))
            : mensagemCarregamento
        }
      />
    );
  }

  return (
    <div className={`${styles.container} ${styles.containerIncorporado} ri-readable`}>
      <AuthAtmosphere intensity="strong" />
      {submitting && !isEditMode && <PageLoader message={t("registration.ui.salvando-cadastro")} mode="overlay" />}
      <div className={styles.card} role="main" aria-labelledby={incorporado ? undefined : "register-title"}>
        {incorporado ? (
          <div className={styles.completionSticky}>
            <ProfileCompletionBar percent={completionPercent} />
          </div>
        ) : null}
        {acoes ? <div className={styles.cardAcoes}>{acoes}</div> : null}
        {!incorporado ? (
          <nav className={styles.voltarHome} aria-label={t("registration.ui.voltar-a-pagina-inicial")}>
            <Link href="/" className={styles.voltarHomeLink}>
              {t("registration.ui.voltar-a-pagina-inicial")}
            </Link>
          </nav>
        ) : null}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <LogoRecruta size="sm" as="div" depth />
        </div>
        {!incorporado ? (
        <h1 id="register-title" className={styles.title}>
          {isEditMode ? t("registration.ui.atualizar-cadastro") : t("registration.ui.complete-seu-perfil")}
        </h1>
        ) : null}
        {formFeedback && (
          <div
            className={`${styles.feedbackBanner} ${
              formFeedback.tone === 'error' ? styles.feedbackBannerError : styles.feedbackBannerSuccess
            }`}
            role={formFeedback.tone === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {formFeedback.message}{' '}
            {formFeedback.tone === 'success' && !isEditMode && (
              <a href="/login?tipo=profissional">{t("registration.ui.ir-para-o-login")}</a>
            )}
          </div>
        )}

        {!incorporado ? (
        <div className={styles.completionSticky}>
          <ProfileCompletionBar percent={completionPercent} />
        </div>
        ) : null}
        {!isEditMode && (
          <p className={styles.formHint}>
            {t("registration.ui.lista-completa")}{" "}
            {t("registration.ui.os-marcados-como")} <strong>{t("registration.ui.obrigatorio")}</strong> {t("registration.ui.sao-necessarios")}
          </p>
        )}



        {useWizard && (
          <RegisterWizardChrome
            step={wizardStep}
            onStepChange={setWizardStep}
            onContinue={tentarAvancarWizard}
          />
        )}

        {useWizard && camposObrigatoriosFaltando.length > 0 && wizardStep < lastWizardStep && (
          <div id="aviso-obrigatorios" className={styles.avisoObrigatoriosCard} role="alert" aria-live="polite">
            <p className={styles.avisoObrigatoriosTitulo}>
              {t("registration.ui.complete-obrigatorios-etapa")}
            </p>
            <ul className={styles.avisoObrigatoriosLista}>
              {camposObrigatoriosFaltando.map((campo) => (
                <li key={`${campo.id}-${campo.label}`}>{campo.label}</li>
              ))}
            </ul>
          </div>
        )}

        {showWizardStep(0) && (
          <>
          <CampoFotoPerfil
            centered
            avisoSalvar={isEditMode}
            value={formData.fotoPerfil}
            onFileSelect={async (file) => {
              if (!arquivoFotoPermitido(file)) {
                throw new Error(t("registration.ui.use-uma-foto-jpg-png-webp-ou-gif"));
              }
              const foto = arquivoFotoComTipo(file);
              const previewUrl = await lerImagemComoDataUrl(foto);
              if (!previewUrl.startsWith('data:image')) {
                throw new Error(t("registration.ui.nao-foi-possivel-ler-a-imagem"));
              }
              setFormData((prev) => ({ ...prev, fotoPerfil: previewUrl }));

              const fd = new FormData();
              fd.append('file', foto);
              fd.append('type', 'avatars');
              const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data.success) {
                throw new Error(typeof data.error === 'string' && data.error.trim()
                  ? data.error
                  : t("registration.ui.nao-foi-possivel-enviar-a-foto-a-previa-ficou-so-nesta-tela"));
              }
              const path = caminhoFotoPerfil(String(data.file?.path || ''))
                || caminhoFotoPerfil(String(data.file?.url || ''));
              if (!path) {
                throw new Error(t("registration.ui.a-foto-foi-enviada-mas-nao-foi-possivel-grava-la-no-perfil"));
              }
              setFormData((prev) => ({ ...prev, fotoPerfil: path }));
              if (isEditMode) {
                const saveRes = await fetch('/api/professional/profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ apenasFoto: true, fotoPerfil: path }),
                });
                if (!saveRes.ok) {
                  const err = await saveRes.json().catch(() => ({} as { error?: unknown }));
                  throw new Error(typeof err.error === 'string' && err.error.trim()
                    ? err.error
                    : t("registration.ui.a-foto-foi-enviada-mas-nao-ficou-salva-no-perfil"));
                }
              }
            }}
          />
          <AnexoCurriculoAutomatico onFile={importarCurriculoArquivo} />
          </>
        )}

        <div inert={travado && !isEditMode ? true : undefined} className={travado && !isEditMode ? styles.cadastroTravado : undefined}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {showWizardStep(0) && (
          <>
          <BlocoCadastro {...propsBloco("dados-pessoais", "🏭", t("registration.ui.dados-pessoais"))}>

            <div className={styles.fieldsRow}>
              <div className={styles.fieldGroup}>
                <RegistrationCountryField
                  id="pais"
                  value={pais}
                  onChange={setPais}
                  disabled={isEditMode || sessionStatus === 'authenticated'}
                  labelClassName={styles.label}
                  selectClassName={styles.input}
                  hintClassName={styles.formHint}
                />
              </div>
            </div>
            
            <div className={styles.fieldsRow}>
              <div className={fg('nome')}>
                <LabelMarcador htmlFor="nome" marcador="obrigatorio">{t("registration.simple.fullName")}</LabelMarcador>
                <input
                  id="nome"
                  type="text"
                  required
                  className={styles.input}
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                />
              </div>

              <div className={fg('dataNascimento')}>
                <LabelMarcador htmlFor="dataNascimento" marcador="obrigatorio" className={styles.labelComHint}>
                  {t("registration.ui.nascimento")} <span className={styles.labelHint}>{t("registration.ui.dd-mm-aaaa")}</span>
                </LabelMarcador>
                <input
                  id="dataNascimento"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  className={styles.input}
                  value={dataNascimentoValue}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                    let formatted = '';

                    if (digits.length <= 2) {
                      formatted = digits;
                    } else if (digits.length <= 4) {
                      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                    } else {
                      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                    }

                    setDataNascimentoValue(formatted);

                    if (digits.length === 0) {
                      setFormData((prev) => ({ ...prev, dataNascimento: '', idade: '' }));
                      return;
                    }

                    if (formatted.length === 10) {
                      const [day, month, year] = formatted.split('/');
                      const dayNum = parseInt(day, 10);
                      const monthNum = parseInt(month, 10);
                      const yearNum = parseInt(year, 10);

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
                          return;
                        }
                      }
                    }

                    setFormData((prev) => ({ ...prev, dataNascimento: '', idade: '' }));
                  }}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="idade">{t("registration.ui.idade")}</label>
                <input
                  id="idade"
                  type="text"
                  inputMode="numeric"
                  className={styles.input}
                  value={formData.idade}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 3);
                    setFormData((prev) => ({ ...prev, idade: onlyDigits }));
                  }}
                />
              </div>

              <div className={fg('sexoBiologico')}>
                <LabelMarcador htmlFor="sexoBiologico" marcador="recomendado">{t("registration.ui.sexo-biologico")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="sexoBiologico"
                    className={styles.select}
                    value={formData.sexoBiologico}
                    onChange={e => setFormData((prev) => ({ ...prev, sexoBiologico: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option>{t("registration.ui.masculino")}</option>
                    <option>{t("registration.ui.feminino")}</option>
                    <option>{t("registration.ui.outro")}</option>
                    <option value={PREFIRO_NAO_INFORMAR}>{rotuloOpcao(PREFIRO_NAO_INFORMAR)}</option>
                  </select>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="identidadeGenero">{t("registration.ui.identidade-de-genero")}</label>
                <div className={styles.selectWrap}>
                  <select
                    id="identidadeGenero"
                    className={styles.select}
                    value={formData.identidadeGenero}
                    onChange={e => setFormData((prev) => ({ ...prev, identidadeGenero: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option>{t("registration.ui.cisgenero")}</option>
                    <option>{t("registration.ui.transgenero")}</option>
                    <option>{t("registration.ui.nao-binario")}</option>
                    <option>{t("registration.ui.outro")}</option>
                    <option value={PREFIRO_NAO_INFORMAR}>{rotuloOpcao(PREFIRO_NAO_INFORMAR)}</option>
                  </select>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="orientacaoSexual">{t("registration.ui.orientacao-sexual")}</label>
                <div className={styles.selectWrap}>
                  <select
                    id="orientacaoSexual"
                    className={styles.select}
                    value={formData.orientacaoSexual}
                    onChange={e => setFormData((prev) => ({ ...prev, orientacaoSexual: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option>{t("registration.ui.heterossexual")}</option>
                    <option>{t("registration.ui.homossexual")}</option>
                    <option>{t("registration.ui.bissexual")}</option>
                    <option>{t("registration.ui.outro")}</option>
                    <option value={PREFIRO_NAO_INFORMAR}>{rotuloOpcao(PREFIRO_NAO_INFORMAR)}</option>
                  </select>
                </div>
              </div>

              <div className={fg('estadoCivil')}>
                <LabelMarcador htmlFor="estadoCivil" marcador="recomendado">{t("registration.ui.estado-civil")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="estadoCivil"
                    className={styles.select}
                    value={formData.estadoCivil}
                    onChange={e => setFormData((prev) => ({ ...prev, estadoCivil: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option>{t("registration.ui.solteiro")}</option>
                    <option>{t("registration.ui.casado")}</option>
                    <option>{t("registration.ui.divorciado")}</option>
                    <option>{t("registration.ui.viuvo")}</option>
                    <option value={PREFIRO_NAO_INFORMAR}>{rotuloOpcao(PREFIRO_NAO_INFORMAR)}</option>
                  </select>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="religiao">{t("registration.ui.religiao")}</label>
                <div className={styles.selectWrap}>
                  <select
                    id="religiao"
                    className={styles.select}
                    value={formData.religiao}
                    onChange={e => setFormData((prev) => ({ ...prev, religiao: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option>{t("registration.ui.catolico")}</option>
                    <option>{t("registration.ui.protestante")}</option>
                    <option>{t("registration.ui.espirita")}</option>
                    <option>{t("registration.ui.ateu")}</option>
                    <option>{t("registration.ui.outro")}</option>
                    <option value={PREFIRO_NAO_INFORMAR}>{rotuloOpcao(PREFIRO_NAO_INFORMAR)}</option>
                  </select>
                </div>
              </div>

              <div className={fg('possuiCNH')}>
                <LabelMarcador htmlFor="possuiCNH" marcador="recomendado">{t("registration.ui.possui-cnh")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="possuiCNH"
                    className={styles.select}
                    value={formData.possuiCNH}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      possuiCNH: e.target.value,
                      categoriaCNH: e.target.value === t("registration.ui.nao") ? '' : prev.categoriaCNH,
                      cnhDocumento: e.target.value === t("registration.ui.nao") ? null : prev.cnhDocumento,
                    }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option value="Sim">{t("registration.ui.sim")}</option>
                    <option value={t("registration.ui.nao")}>{t("registration.ui.nao")}</option>
                    <option value={PREFIRO_NAO_INFORMAR}>{rotuloOpcao(PREFIRO_NAO_INFORMAR)}</option>
                  </select>
                </div>
              </div>

              {formData.possuiCNH === 'Sim' && (
                <div className={fg('categoriaCNH')}>
                  <LabelMarcador htmlFor="categoriaCNH" marcador="recomendado">{t("registration.ui.categoria-da-cnh")}</LabelMarcador>
                  <div className={styles.selectWrap}>
                    <select
                      id="categoriaCNH"
                      className={styles.select}
                      value={formData.categoriaCNH}
                      onChange={(e) => setFormData((prev) => ({ ...prev, categoriaCNH: e.target.value }))}
                    >
                      <option value="">{t("registration.ui.selecione")}</option>
                      {CNH_CATEGORIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className={fg('antecedentes')}>
                <LabelMarcador htmlFor="antecedentes" marcador="recomendado">{t("registration.ui.antecedentes-criminais")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="antecedentes"
                    className={styles.select}
                    value={formData.antecedentes}
                    onChange={e => setFormData((prev) => ({ ...prev, antecedentes: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option value={t("registration.ui.nao")}>{t("registration.ui.nao")}</option>
                    <option value="Sim">{t("registration.ui.sim")}</option>
                    <option value={PREFIRO_NAO_INFORMAR}>{rotuloOpcao(PREFIRO_NAO_INFORMAR)}</option>
                  </select>
                </div>
              </div>
            </div>

            {formData.possuiCNH === 'Sim' && (
              <div className={styles.fieldsRow}>
                <div className={`${styles.fieldGroup} ${styles.fieldWide}`}>
                  <CampoArquivoAnexo
                    id="cnhDocumento"
                    label={t("registration.ui.certificado-da-cnh-opcional")}
                    accept=".pdf,.jpg,.jpeg,.png"
                    value={formData.cnhDocumento}
                    textoBotaoVazio={t("registration.ui.selecionar-certificado-da-cnh")}
                    onFileSelect={async (file) => {
                      const url = await uploadFile(file, 'cnh-documentos');
                      if (url) setFormData((prev) => ({ ...prev, cnhDocumento: url }));
                    }}
                  />
                </div>
              </div>
            )}

            <div className={`${styles.fieldGroup} ${styles.fieldWide}`}>
              <CertificadoCursoUpload
                curso={{
                  nome: t("registration.ui.atestado-de-antecedentes"),
                  possuiCertificado: formData.possuiAtestadoAntecedentes || Boolean(formData.atestado),
                  certificadoUrl: formData.atestado ?? undefined,
                }}
                checkboxLabel={t("registration.ui.anexo-de-antecedentes-criminais-opcional")}
                uploadType="documents"
                onChange={(patch) => {
                  setFormData((prev) => ({
                    ...prev,
                    ...(patch.possuiCertificado !== undefined
                      ? { possuiAtestadoAntecedentes: patch.possuiCertificado }
                      : {}),
                    atestado:
                      patch.certificadoUrl !== undefined
                        ? (patch.certificadoUrl ?? null)
                        : patch.possuiCertificado === false
                          ? null
                          : prev.atestado,
                  }));
                }}
              />
            </div>

            <RegisterCollapsibleSection
              emoji="👨‍👩‍👧‍👦"
              title={t("registration.ui.filhos")}
              marcador="recomendado"
              defaultOpen={formData.possuiFilhos === 'Sim'}
            >
              <div className={styles.fieldsRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="possuiFilhos">{t("registration.ui.possui-filhos")}</label>
                  <div className={styles.selectWrap}>
                    <select id="possuiFilhos" className={styles.select} value={formData.possuiFilhos} onChange={e => setFormData((prev) => ({ ...prev, possuiFilhos: e.target.value }))}>
                      <option value="">{t("registration.ui.selecione")}</option>
                      <option>{t("registration.ui.nao")}</option>
                      <option>{t("registration.ui.sim")}</option>
                    </select>
                  </div>
                </div>

                {formData.possuiFilhos === 'Sim' && (
                  <>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="quantidadeFilhos">{t("registration.ui.quantidade-de-filhos")}</label>
                      <div className={styles.selectWrap}>
                        <select
                          id="quantidadeFilhos"
                          className={styles.select}
                          value={formData.quantidadeFilhos}
                          onChange={e => setFormData((prev) => ({ ...prev, quantidadeFilhos: e.target.value }))}
                        >
                          <option value="">{t("registration.ui.selecione")}</option>
                          <option>1</option>
                          <option>2</option>
                          <option>3</option>
                          <option>4+</option>
                        </select>
                      </div>
                    </div>

                    <div className={`${styles.fieldGroup} ${styles.fieldSpan2}`}>
                      <span className={styles.label}>{t("registration.ui.faixa-etaria-dos-filhos")}</span>
                      <div className={styles.tagFieldBox}>
                        <div className={styles.tagList}>
                          {[t("registration.ui.menos-de-1"), t("registration.ui.1-a-3"), t("registration.ui.3-a-5"), t("registration.ui.5-a-7"), t("registration.ui.7-a-9"), t("registration.ui.9-a-12"), t("registration.ui.acima-de-12")].map((faixa) => {
                            const selected = formData.faixaEtariaFilhos.includes(faixa);
                            return (
                              <button
                                key={faixa}
                                type="button"
                                className={`${styles.tagChip} ${selected ? styles.tagChipActive : ''}`}
                                aria-pressed={selected}
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    faixaEtariaFilhos: selected
                                      ? prev.faixaEtariaFilhos.filter((f) => f !== faixa)
                                      : [...prev.faixaEtariaFilhos, faixa],
                                  }));
                                }}
                              >
                                {faixa}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </RegisterCollapsibleSection>
          </BlocoCadastro>

          <BlocoCadastro {...propsBloco("contato", "📞", t("registration.ui.contato"))}>

            <div className={styles.fieldsRow}>
              <div className={fg('email')}>
                <LabelMarcador htmlFor="email" marcador="obrigatorio">{t("registration.simple.email")}</LabelMarcador>
                <input
                  id="email"
                  type="email"
                  required
                  className={styles.input}
                  value={formData.email}
                  readOnly={cadastroComGoogle}
                  onChange={(e) => {
                    if (cadastroComGoogle) return;
                    const email = e.target.value;
                    setFormData((prev) => ({ ...prev, email }));
                    if (email && !isValidEmail(email)) {
                      setEmailError(t("registration.ui.email-invalido"));
                    } else {
                      setEmailError('');
                    }
                  }}
                  style={{
                    borderColor: emailError ? '#dc3545' : undefined,
                    opacity: cadastroComGoogle ? 0.9 : 1,
                  }}
                  title={cadastroComGoogle ? t("registration.ui.e-mail-da-conta-ja-criada") : undefined}
                />
              </div>
              <div className={fg('telefone')}>
                <LabelMarcador htmlFor="telefone" marcador="obrigatorio">
                  {pais === 'BR' ? t("registration.ui.telefone-whatsapp-ddd") : t("registration.ui.telefone-internacional")}
                </LabelMarcador>
                <input
                  id="telefone"
                  type="tel"
                  className={styles.input}
                  placeholder={pais === 'BR' ? t("registration.ui.xx-xxxxx-xxxx") : t("registration.ui.telefone-placeholder-intl")}
                  value={telefone}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (pais !== 'BR') {
                      const intl = value.replace(/[^\d+\s()-]/g, '').slice(0, 20);
                      setTelefone(intl);
                      setFormData((prev) => ({ ...prev, telefone: intl }));
                      return;
                    }
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
              <div className={fg('whatsapp')}>
                <LabelMarcador htmlFor="whatsapp" marcador="obrigatorio">{t("registration.ui.este-numero-e-whatsapp")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="whatsapp"
                    className={styles.select}
                    value={formData.whatsapp}
                    onChange={e => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  >
                    <option value={t("registration.ui.nao")}>{t("registration.ui.nao")}</option>
                    <option value="Sim">{t("registration.ui.sim")}</option>
                  </select>
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="telefone2">{t("registration.ui.telefone-alternativo-ddd")}</label>
                <input
                  id="telefone2"
                  type="tel"
                  className={styles.input}
                  placeholder={pais === 'BR' ? t("registration.ui.xx-xxxxx-xxxx") : t("registration.ui.telefone-placeholder-intl")}
                  value={telefone2}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (pais !== 'BR') {
                      const intl = value.replace(/[^\d+\s()-]/g, '').slice(0, 20);
                      setTelefone2(intl);
                      setFormData((prev) => ({ ...prev, telefone2: intl }));
                      return;
                    }
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
            {emailError && (
              <div className={styles.fieldNotice}>
                <span style={{ color: '#dc3545', fontSize: '12px' }}>❌ {emailError}</span>
              </div>
            )}

            {cadastroComGoogle && (
              <p style={{ color: '#414141', fontSize: 13, margin: '0 0 12px' }}>
                {t("registration.ui.conta-google-criada")}
              </p>
            )}

          </BlocoCadastro>

          <BlocoCadastro {...propsBloco("localizacao", "📍", t("registration.ui.localizacao"))}>

            <div className={styles.fieldsRow}>
              <div className={fg('estado')}>
                <LabelMarcador htmlFor="estado" marcador="obrigatorio">
                  {pais === 'BR' ? t("registration.ui.estado-uf") : t("registration.ui.estado-regiao")}
                </LabelMarcador>
                {pais === 'BR' ? (
                  <div className={styles.selectWrap}>
                    <select
                      id="estado"
                      className={styles.select}
                      required
                      value={formData.estado}
                      onChange={(e) => {
                        pendingCidadeImportRef.current = null;
                        setFormData((prev) => ({ ...prev, estado: e.target.value, cidade: '' }));
                      }}
                    >
                      <option value="">{t("registration.ui.selecione")}</option>
                      {listaEstados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                ) : (
                  <input
                    id="estado"
                    type="text"
                    className={styles.input}
                    required
                    maxLength={80}
                    value={formData.estado}
                    onChange={(e) => {
                      pendingCidadeImportRef.current = null;
                      setFormData((prev) => ({ ...prev, estado: e.target.value }));
                    }}
                  />
                )}
              </div>
              <div className={fg('cidade')}>
                <LabelMarcador htmlFor="cidade" marcador="obrigatorio">{t("registration.ui.cidade")}</LabelMarcador>
                {pais === 'BR' ? (
                  <div className={styles.selectWrap}>
                    <select
                      id="cidade"
                      className={styles.select}
                      required
                      value={formData.cidade}
                      onChange={e => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                    >
                      <option value="">{t("registration.ui.escolha-a-cidade")}</option>
                      {cidades.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                  </div>
                ) : (
                  <input
                    id="cidade"
                    type="text"
                    className={styles.input}
                    required
                    maxLength={120}
                    value={formData.cidade}
                    onChange={e => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                  />
                )}
              </div>
              <div className={fg('disponibilidadeMudanca')}>
                <LabelMarcador htmlFor="disponibilidadeMudanca" marcador="recomendado">{t("registration.ui.disponibilidade-para-mudanca")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="disponibilidadeMudanca"
                    className={styles.select}
                    value={formData.disponibilidadeMudanca}
                    onChange={e => setFormData((prev) => ({ ...prev, disponibilidadeMudanca: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option value="Sim">{t("registration.ui.sim")}</option>
                    <option value={t("registration.ui.nao")}>{t("registration.ui.nao")}</option>
                    <option value={t("registration.ui.dependendo-da-oportunidade")}>{t("registration.ui.dependendo-da-oportunidade")}</option>
                  </select>
                </div>
              </div>
              <div className={fg('aceitaViagens')}>
                <LabelMarcador htmlFor="aceitaViagens" marcador="recomendado">{t("registration.ui.disponibilidade-para-viagens")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="aceitaViagens"
                    className={styles.select}
                    value={formData.aceitaViagens}
                    onChange={e => setFormData((prev) => ({ ...prev, aceitaViagens: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option value="Sim">{t("registration.ui.sim")}</option>
                    <option value={t("registration.ui.nao")}>{t("registration.ui.nao")}</option>
                    <option value="Dependendo">{t("registration.ui.dependendo")}</option>
                    <option value={PREFIRO_NAO_INFORMAR}>{rotuloOpcao(PREFIRO_NAO_INFORMAR)}</option>
                  </select>
                </div>
              </div>
            </div>
          </BlocoCadastro>
          </>
          )}

          {showWizardStep(1) && (
          <>
          <BlocoCadastro {...propsBloco("formacao", "🎓", t("registration.ui.formacao"))}>

            <div className={styles.formSubCards}>
              <div className={styles.formSubCard}>
                <TextoMarcador>{t("registration.ui.escolaridade")}</TextoMarcador>
                <div className={styles.fieldsRow}>
                  <div className={fg('escolaridade')}>
                    <LabelMarcador htmlFor="escolaridade" marcador="obrigatorio">{t("registration.ui.nivel")}</LabelMarcador>
                    <div className={styles.selectWrap}>
                      <select
                        id="escolaridade"
                        className={styles.select}
                        required
                        value={formData.escolaridade}
                        onChange={e => setFormData((prev) => ({ ...prev, escolaridade: e.target.value }))}
                      >
                        <option value="">{t("registration.ui.selecione")}</option>
                        {ESCOLARIDADES_OPCOES.map((nivel) => (
                          <option key={nivel} value={nivel}>{rotuloOpcao(nivel)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={fg('cursoFormacao')}>
                    <LabelMarcador htmlFor="cursoFormacao" marcador="recomendado">{t("registration.ui.curso")}</LabelMarcador>
                    <input
                      id="cursoFormacao"
                      type="text"
                      className={styles.input}
                      placeholder={t("registration.ui.ex-2-ano-medicina")}
                      value={formData.cursoFormacao}
                      onChange={e => setFormData((prev) => ({ ...prev, cursoFormacao: e.target.value }))}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <LabelMarcador htmlFor="instituicaoFormacao" marcador="recomendado">{t("registration.ui.instituicao")}</LabelMarcador>
                    <input
                      id="instituicaoFormacao"
                      type="text"
                      className={styles.input}
                      placeholder={t("registration.ui.ex-senai-ufpr")}
                      value={formData.instituicaoFormacao}
                      onChange={e => setFormData((prev) => ({ ...prev, instituicaoFormacao: e.target.value }))}
                    />
                  </div>
                  <div className={fg('anoConclusaoFormacao')}>
                    <LabelMarcador htmlFor="anoConclusaoFormacao" marcador="recomendado">{t("registration.ui.ano-de-conclusao")}</LabelMarcador>
                    <input
                      id="anoConclusaoFormacao"
                      type="number"
                      className={styles.input}
                      placeholder={t("registration.ui.ex-2020")}
                      min={1950}
                      max={new Date().getFullYear() + 5}
                      value={formData.anoConclusaoFormacao}
                      onChange={e => setFormData((prev) => ({ ...prev, anoConclusaoFormacao: e.target.value }))}
                    />
                  </div>
                </div>
                <CertificadoCursoUpload
                  curso={{
                    nome: formData.cursoFormacao,
                    possuiCertificado: formData.possuiCertificadoFormacao || Boolean(formData.documentoFormacao),
                    certificadoUrl: formData.documentoFormacao ?? undefined,
                  }}
                  checkboxLabel={t("registration.ui.anexar-historico-declaracao-certificado-opcional")}
                  uploadType="documentos-formacao"
                  onChange={(patch) => {
                    setFormData((prev) => ({
                      ...prev,
                      ...(patch.possuiCertificado !== undefined
                        ? { possuiCertificadoFormacao: patch.possuiCertificado }
                        : {}),
                      documentoFormacao:
                        patch.certificadoUrl !== undefined
                          ? (patch.certificadoUrl ?? null)
                          : patch.possuiCertificado === false
                            ? null
                            : prev.documentoFormacao,
                    }));
                  }}
                />
              </div>

              <div className={styles.formSubCard}>
                <TextoMarcador marcador="recomendado">{t("registration.ui.cursos")}</TextoMarcador>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--dash-text, #414141)', lineHeight: 1.45 }}>
                  {t("registration.ui.preencha-cursos")}
                </p>
                <datalist id="cursosIndustriaisSugeridos">
                  {CURSOS_INDUSTRIAIS_SUGERIDOS.map((c) => (
                    <option key={c} value={c}>{rotuloOpcao(c)}</option>
                  ))}
                </datalist>
                {cursos.map((curso, index) => {
                const atualizar = (patch: Partial<CursoDetalhado>) => {
                  const novos = cursos.map((c, i) => (i === index ? { ...c, ...patch } : c));
                  setCursos(novos);
                  setFormData((prev) => ({
                    ...prev,
                    cursosCertificacoes: novos.map((c) => c.nome).filter((n) => n.trim()).join(', '),
                  }));
                };
                return (
                  <div key={index} className={styles.cursoItem}>
                    <div className={styles.fieldsRow}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t("registration.ui.nome-do-curso")}</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder={t("registration.ui.ex-nr-11-metrologia")}
                          list="cursosIndustriaisSugeridos"
                          value={curso.nome}
                          onChange={(e) => atualizar({ nome: e.target.value })}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t("registration.ui.instituicao")}</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder={t("registration.ui.ex-senai")}
                          value={curso.instituicao ?? ''}
                          onChange={(e) => atualizar({ instituicao: e.target.value })}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t("registration.ui.carga-horaria")}</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder={t("registration.ui.ex-40h")}
                          value={curso.cargaHoraria ?? ''}
                          onChange={(e) => atualizar({ cargaHoraria: e.target.value })}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t("registration.ui.conclusao")}</label>
                        <input
                          type="date"
                          className={styles.input}
                          value={curso.dataConclusao ?? ''}
                          onChange={(e) => atualizar({ dataConclusao: e.target.value })}
                        />
                      </div>
                      {cursos.length > 1 && (
                        <div className={styles.addBtnRow}>
                          <button
                            type="button"
                            className={styles.addBtnSmall}
                            onClick={() => {
                              const novos = cursos.filter((_, i) => i !== index);
                              setCursos(novos);
                              setFormData((prev) => ({
                                ...prev,
                                cursosCertificacoes: novos.map((c) => c.nome).filter((n) => n.trim()).join(', '),
                              }));
                            }}
                            aria-label={t("registration.ui.remover-curso")}
                          >
                            ✕ Remover curso
                          </button>
                        </div>
                      )}
                    </div>
                    <CertificadoCursoUpload
                      curso={curso}
                      checkboxLabel={t("registration.ui.anexar-certificado-opcional")}
                      onChange={(patch) => atualizar(patch)}
                    />
                  </div>
                );
              })}
                <div className={styles.addBtnRow}>
                  <button
                    type="button"
                    className={styles.addBtnSmall}
                    onClick={() => setCursos([...cursos, { nome: '', possuiCertificado: false }])}
                  >
                    {t("registration.ui.adicionar-outro-curso")}
                  </button>
                </div>
              </div>

              <div className={styles.formSubCard}>
                <TextoMarcador marcador="recomendado">{t("registration.ui.certificacoes")}</TextoMarcador>
                {certificacoes.map((cert, index) => {
                  const atualizar = (patch: Partial<CertificacaoDetalhada>) => {
                    setCertificacoes((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
                  };
                  return (
                    <div key={index} className={styles.cursoItem}>
                      <div className={styles.fieldsRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>{t("registration.ui.nome-da-certificacao")}</label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder={t("registration.ui.ex-iso-9001-lead-auditor")}
                            value={cert.nome}
                            onChange={(e) => atualizar({ nome: e.target.value })}
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>{t("registration.ui.emissor")}</label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder={t("registration.ui.ex-bureau-veritas")}
                            value={cert.emissor ?? ''}
                            onChange={(e) => atualizar({ emissor: e.target.value })}
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>{t("registration.ui.validade")}</label>
                          <input
                            type="date"
                            className={styles.input}
                            value={cert.validade ?? ''}
                            onChange={(e) => atualizar({ validade: e.target.value })}
                          />
                        </div>
                        {certificacoes.length > 1 && (
                          <div className={styles.addBtnRow}>
                            <button
                              type="button"
                              className={styles.addBtnSmall}
                              onClick={() => setCertificacoes(certificacoes.filter((_, i) => i !== index))}
                              aria-label={t("registration.ui.remover-certificacao")}
                            >
                              {t("registration.ui.remover-certificacao-botao")}
                            </button>
                          </div>
                        )}
                      </div>
                      <CertificadoCursoUpload
                        curso={{
                          nome: cert.nome,
                          validadeCertificado: cert.validade,
                          possuiCertificado: cert.possuiCertificado,
                          certificadoUrl: cert.certificadoUrl,
                          verificado: cert.verificado,
                        }}
                        checkboxLabel={t("registration.ui.anexar-certificado-opcional")}
                        uploadType="certificacoes"
                        onChange={(patch) =>
                          atualizar({
                            possuiCertificado: patch.possuiCertificado,
                            certificadoUrl: patch.certificadoUrl,
                            verificado: patch.verificado,
                            ...(patch.validadeCertificado !== undefined
                              ? { validade: patch.validadeCertificado }
                              : {}),
                          })
                        }
                      />
                    </div>
                  );
                })}
                <div className={styles.addBtnRow}>
                  <button
                    type="button"
                    className={styles.addBtnSmall}
                    onClick={() => setCertificacoes([...certificacoes, { nome: '' }])}
                  >
                    {t("registration.ui.adicionar-certificacao")}
                  </button>
                </div>
              </div>

              <div className={styles.formSubCard}>
                <TextoMarcador marcador="recomendado">{t("registration.ui.idiomas")}</TextoMarcador>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {idiomas.map((idioma, index) => (
                <div key={index}>
                  <div className={styles.fieldsRow} style={{ marginBottom: 0 }}>
                    <div className={styles.fieldGroup} style={{ marginBottom: 0 }}>
                      <div className={styles.selectWrap}>
                        <select
                          className={styles.select}
                          value={idioma.selecionado}
                          onChange={(e) => {
                            const novosIdiomas = [...idiomas];
                            novosIdiomas[index] = {
                              selecionado: e.target.value,
                              custom: e.target.value === 'Outros' ? idioma.custom : undefined,
                            };
                            setIdiomas(novosIdiomas);
                          }}
                        >
                          <option value="">{t("registration.ui.selecione-o-idioma")}</option>
                          {IDIOMAS_OPCOES.map((opcao) => (
                            <option key={opcao} value={opcao}>{rotuloOpcao(opcao)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {idioma.selecionado === 'Outros' && (
                      <div className={styles.fieldGroup} style={{ marginBottom: 0 }}>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder={t("registration.ui.digite-o-idioma")}
                          value={idioma.custom ?? ''}
                          onChange={(e) => {
                            const novosIdiomas = [...idiomas];
                            novosIdiomas[index] = { ...idioma, custom: e.target.value };
                            setIdiomas(novosIdiomas);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {idiomas.length > 1 && (
                    <div className={styles.addBtnRow} style={{ marginTop: 0 }}>
                      <button
                        type="button"
                        className={styles.addBtnSmall}
                        onClick={() => setIdiomas(idiomas.filter((_, i) => i !== index))}
                        aria-label={t("registration.ui.remover-idioma")}
                      >
                        ✕ Remover idioma
                      </button>
                    </div>
                  )}
                </div>
              ))}
                  <div className={styles.addBtnRow}>
                    <button
                      type="button"
                      className={styles.addBtnSmall}
                      onClick={() => setIdiomas([...idiomas, { selecionado: '' }])}
                    >
                      {t("registration.ui.adicionar-idioma")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </BlocoCadastro>

          <BlocoCadastro {...propsBloco("perfil-profissional", "💼", t("registration.ui.perfil-profissional"))}>

            <div className={styles.fieldsRow}>
              <div className={fg('situacaoProfissional')}>
                <LabelMarcador htmlFor="situacaoProfissional" marcador="obrigatorio">{t("registration.ui.situacao-profissional-atual")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="situacaoProfissional"
                    className={styles.select}
                    required
                    value={formData.situacaoProfissional}
                    onChange={(e) => setFormData((prev) => ({ ...prev, situacaoProfissional: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option value="Empregado">{t("registration.ui.empregado")}</option>
                    <option value="Desempregado">{t("registration.ui.desempregado")}</option>
                    <option value={t("registration.ui.primeiro-emprego")}>{t("registration.ui.primeiro-emprego")}</option>
                    <option value={t("registration.ui.jovem-aprendiz-16-a-18")}>{t("registration.ui.jovem-aprendiz-16-a-18")}</option>
                  </select>
                </div>
              </div>

              <div className={fg('areaInteresse')}>
                <LabelMarcador htmlFor="areaInteresse" marcador="recomendado">{t("registration.ui.area-de-interesse")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="areaInteresse"
                    className={styles.select}
                    value={formData.areaInteresse}
                    onChange={(e) => setFormData((prev) => ({ ...prev, areaInteresse: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option>{t("registration.ui.automotivo")}</option>
                    <option>{t("registration.ui.aviacao")}</option>
                    <option>{t("registration.ui.celulose-e-papel")}</option>
                    <option>{t("registration.ui.ceramica")}</option>
                    <option>{t("registration.ui.construcao-civil")}</option>
                    <option>{t("registration.ui.defesa-e-seguranca")}</option>
                    <option>{t("registration.ui.eletricidade")}</option>
                    <option>{t("registration.ui.eletronica")}</option>
                    <option>{t("registration.ui.energia")}</option>
                    <option>{t("registration.ui.engenharia")}</option>
                    <option>{t("registration.ui.farmaceutica")}</option>
                    <option>{t("registration.ui.ferramentas")}</option>
                    <option>{t("registration.ui.fiacao-e-tecelagem")}</option>
                    <option>{t("registration.ui.fundicao")}</option>
                    <option>{t("registration.ui.gas-industrial")}</option>
                    <option>{t("registration.ui.industria-alimenticia")}</option>
                    <option>{t("registration.ui.industria-beverages")}</option>
                    <option>{t("registration.ui.industria-cosmetica")}</option>
                    <option>{t("registration.ui.industria-de-embalagem")}</option>
                    <option>{t("registration.ui.industria-de-maquinas")}</option>
                    <option>{t("registration.ui.industria-de-plastico")}</option>
                    <option>{t("registration.ui.industria-de-quimica")}</option>
                    <option>{t("registration.ui.industria-de-vestuario")}</option>
                    <option>{t("registration.ui.industria-grafica")}</option>
                    <option>{t("registration.ui.industria-metal-mecanica")}</option>
                    <option>{t("registration.ui.industria-textil")}</option>
                    <option>{t("registration.ui.infraestrutura")}</option>
                    <option>{t("registration.ui.instalacoes-eletricas")}</option>
                    <option>{t("registration.ui.laminacao")}</option>
                    <option>{t("registration.ui.logistica-industrial")}</option>
                    <option>{t("registration.ui.loucas-e-vidros")}</option>
                    <option>{t("registration.ui.madeira-e-moveis")}</option>
                    <option>{t("registration.ui.manutencao-industrial")}</option>
                    <option>{t("registration.ui.marmore-e-granito")}</option>
                    <option>{t("registration.ui.materiais-de-construcao")}</option>
                    <option>{t("registration.ui.materiais-eletricos")}</option>
                    <option>{t("registration.ui.mecanica-de-precisao")}</option>
                    <option>{t("registration.ui.mecanica-industrial")}</option>
                    <option>{t("registration.ui.metalurgia")}</option>
                    <option>{t("registration.ui.mineracao")}</option>
                    <option>{t("registration.ui.petroquimica")}</option>
                    <option>{t("registration.ui.plastico")}</option>
                    <option>{t("registration.ui.pneumatica-e-hidraulica")}</option>
                    <option>{t("registration.ui.produtos-quimicos")}</option>
                    <option>{t("registration.ui.refinaria")}</option>
                    <option>{t("registration.ui.siderurgia")}</option>
                    <option>{t("registration.ui.solda-e-estruturas-metalicas")}</option>
                    <option>{t("registration.ui.tratamento-de-agua")}</option>
                    <option>{t("registration.ui.tratamento-de-residuos")}</option>
                    <option>{t("registration.ui.tubo-e-conexoes")}</option>
                    <option>{t("registration.ui.usina-hidreletrica")}</option>
                    <option>{t("registration.ui.usina-termeletrica")}</option>
                  </select>
                </div>
              </div>

              <div className={fg('nivelOperacional')}>
                <LabelMarcador htmlFor="nivelOperacional" marcador="recomendado">{t("registration.ui.nivel-operacional")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="nivelOperacional"
                    className={styles.select}
                    value={formData.nivelOperacional}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      nivelOperacional: e.target.value,
                      areaNivel: '',
                      detalheNivel: '',
                    }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    {NIVEIS_OPERACIONAIS.map((nivel) => (
                      <option key={nivel} value={nivel}>{rotuloOpcao(nivel)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.nivelOperacional && (
                <div className={fg('areaNivel')}>
                  <LabelMarcador htmlFor="areaNivel" marcador="recomendado">{t("registration.ui.area-operacional")}</LabelMarcador>
                  <div className={styles.selectWrap}>
                    <select
                      id="areaNivel"
                      className={styles.select}
                      value={formData.areaNivel}
                      onChange={(e) => setFormData((prev) => ({ ...prev, areaNivel: e.target.value }))}
                    >
                      <option value="">{t("registration.ui.selecione")}</option>
                      {AREAS_COMPLEMENTO_NIVEL.map((area) => (
                        <option key={area} value={area}>{rotuloOpcao(area)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className={fg('cargoDesejado')}>
                <LabelMarcador htmlFor="cargoDesejado" marcador="obrigatorio">{t("registration.ui.cargo-desejado")}</LabelMarcador>
                <input
                  id="cargoDesejado"
                  type="text"
                  required
                  className={styles.input}
                  placeholder={t("registration.ui.ex-operador-de-cnc-inspetor-de-qualidade")}
                  value={formData.cargoDesejado}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cargoDesejado: e.target.value }))}
                />
              </div>

              <div className={fg('turnoDisponivel')}>
                <LabelMarcador htmlFor="turnoDisponivel" marcador="recomendado">{t("registration.ui.turno-disponivel")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="turnoDisponivel"
                    className={styles.select}
                    value={formData.turnoDisponivel}
                    onChange={(e) => setFormData((prev) => ({ ...prev, turnoDisponivel: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option value={t("registration.ui.1-turno")}>{t("registration.ui.primeiro")}</option>
                    <option value={t("registration.ui.2-turno")}>{t("registration.ui.segundo")}</option>
                    <option value={t("registration.ui.3-turno")}>{t("registration.ui.terceiro")}</option>
                    <option value="Integral">{t("registration.ui.integral")}</option>
                  </select>
                </div>
              </div>
              <div className={fg('disponibilidadeInicio')}>
                <LabelMarcador htmlFor="disponibilidadeInicio" marcador="recomendado">{t("registration.ui.disponibilidade-para-inicio")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="disponibilidadeInicio"
                    className={styles.select}
                    value={formData.disponibilidadeInicio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, disponibilidadeInicio: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option value="Imediata">{t("registration.ui.imediata")}</option>
                    <option value={t("registration.ui.15-dias")}>{t("registration.ui.15-dias")}</option>
                    <option value={t("registration.ui.30-dias")}>{t("registration.ui.30-dias")}</option>
                    <option value={t("registration.ui.2-meses")}>{t("registration.ui.2-meses")}</option>
                  </select>
                </div>
              </div>
              <div className={fg('pretensaoSalarial')}>
                <LabelMarcador htmlFor="pretensaoSalarial" marcador="obrigatorio">{t("registration.ui.pretensao-salarial")}</LabelMarcador>
                <input
                  id="pretensaoSalarial"
                  type="text"
                  className={styles.input}
                  placeholder={t("registration.ui.ex-r-2-500-00")}
                  value={pretensaoSalarial}
                  onChange={(e) => formatSalario(e.target.value)}
                />
              </div>
            </div>
          </BlocoCadastro>

          <BlocoCadastro {...propsBloco("experiencia", "💼", t("registration.ui.experiencia-na-industria"))}>

            <div className={styles.fieldsRow}>
              <div className={fg('trabalhouIndustria')}>
                <LabelMarcador htmlFor="trabalhouIndustria" marcador="recomendado">{t("registration.ui.trabalhou-na-industria")}</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="trabalhouIndustria"
                    className={styles.select}
                    value={formData.trabalhouIndustria}
                    onChange={(e) => setFormData((prev) => ({ ...prev, trabalhouIndustria: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option value={t("registration.ui.nao")}>{t("registration.ui.nao")}</option>
                    <option value={t("registration.ui.primeiro-emprego")}>{t("registration.ui.primeiro-emprego")}</option>
                    <option value={t("registration.ui.jovem-aprendiz")}>{t("registration.ui.jovem-aprendiz")}</option>
                    <option value="Sim">{t("registration.ui.sim")}</option>
                  </select>
                </div>
              </div>

            {formData.trabalhouIndustria === 'Sim' && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="tempoExperiencia">{t("registration.ui.tempo-total-de-experiencia")}</label>
                <div className={styles.selectWrap}>
                  <select
                    id="tempoExperiencia"
                    className={styles.select}
                    value={formData.tempoExperiencia}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tempoExperiencia: e.target.value }))}
                  >
                    <option value="">{t("registration.ui.selecione")}</option>
                    <option value={t("registration.ui.menos-de-1-ano")}>{t("registration.ui.menos-de-1-ano")}</option>
                    <option value={t("registration.ui.1-2-anos")}>{t("registration.ui.1-2-anos")}</option>
                    <option value={t("registration.ui.3-5-anos")}>{t("registration.ui.3-5-anos")}</option>
                    <option value={t("registration.ui.6-10-anos")}>{t("registration.ui.6-10-anos")}</option>
                    <option value={t("registration.ui.mais-de-10-anos")}>{t("registration.ui.mais-de-10-anos")}</option>
                  </select>
                </div>
              </div>
            )}
            </div>

            <>
                <TextoMarcador>{t("registration.ui.experiencias-profissionais")}</TextoMarcador>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--dash-text, #414141)', lineHeight: 1.45 }}>
                  {t("registration.ui.opcional-experiencia")}
                </p>
                <div className={blocoErro('experiencias')} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {empresas.map((empresa, index) => (
                    <div
                      key={index}
                      className={index === 0 ? blocoErro('experiencias') : undefined}
                      style={{ border: '2px solid #8D6B1F', padding: '15px', borderRadius: '4px', backgroundColor: '#E8D5A3' }}
                    >
                      <p style={{ margin: '0 0 10px', fontWeight: 'bold', color: '#C89B3C' }}>Empresa {index + 1}</p>
                      <div className={styles.fieldsRow}>
                        <div className={index === 0 ? fg('experiencias') : styles.fieldGroup}>
                          <LabelMarcador>{t("registration.ui.nome-da-empresa")}</LabelMarcador>
                          <input
                            id={index === 0 ? 'experiencias' : undefined}
                            type="text"
                            className={styles.input}
                            placeholder={t("registration.ui.nome-da-empresa")}
                            value={empresa.nome}
                            onChange={(e) => {
                              const novasEmpresas = [...empresas];
                              novasEmpresas[index].nome = e.target.value;
                              setEmpresas(novasEmpresas);
                              if (e.target.value.trim()) {
                                setFormData((prev) =>
                                  prev.trabalhouIndustria === 'Sim'
                                    ? prev
                                    : { ...prev, trabalhouIndustria: 'Sim' },
                                );
                              }
                            }}
                          />
                        </div>
                        <div className={index === 0 ? fg('experiencias') : styles.fieldGroup}>
                          <LabelMarcador>{t("registration.ui.cargo")}</LabelMarcador>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder={t("registration.ui.ex-eletricista-soldador")}
                            value={empresa.cargo}
                            onChange={(e) => {
                              const novasEmpresas = [...empresas];
                              novasEmpresas[index].cargo = e.target.value;
                              setEmpresas(novasEmpresas);
                            }}
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>{t("registration.ui.segmento")}</label>
                          <div className={styles.selectWrap}>
                            <select
                              className={styles.select}
                              value={empresa.segmento}
                              onChange={(e) => {
                                const novasEmpresas = [...empresas];
                                novasEmpresas[index].segmento = e.target.value;
                                setEmpresas(novasEmpresas);
                              }}
                            >
                              <option value="">{t("registration.ui.selecione-o-segmento")}</option>
                              {SEGMENTOS_INDUSTRIA.map((seg) => (
                                <option key={seg} value={seg}>{rotuloOpcao(seg)}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className={styles.fieldGroup}>
                          <LabelMarcador>{t("registration.ui.inicio-mes-ano")}</LabelMarcador>
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
                        <div className={styles.fieldGroup}>
                          <LabelMarcador marcador="recomendado">{t("registration.ui.fim-mes-ano")}</LabelMarcador>
                          <input
                            type="month"
                            className={styles.input}
                            value={empresa.dataFim}
                            onChange={(e) => {
                              const novasEmpresas = [...empresas];
                              novasEmpresas[index].dataFim = e.target.value;
                              setEmpresas(novasEmpresas);
                            }}
                          />
                        </div>
                      </div>
                      <div className={`${styles.fieldGroup} ${styles.fieldWide}`}>
                        <label className={styles.label}>{t("registration.ui.descreva")}</label>
                        <textarea
                          className={`${styles.input} ${styles.textarea}`}
                          rows={3}
                          placeholder={t("registration.ui.descreva-suas-atividades-responsabilidades-e-conquistas-nesta-em")}
                          value={empresa.descricao}
                          onChange={(e) => {
                            const novasEmpresas = [...empresas];
                            novasEmpresas[index].descricao = e.target.value;
                            setEmpresas(novasEmpresas);
                          }}
                        />
                      </div>

                      {empresas.length > 1 && (
                        <div className={styles.addBtnRow}>
                          <button
                            type="button"
                            className={styles.addBtnSmall}
                            onClick={() => {
                              const novasEmpresas = empresas.filter((_, i) => i !== index);
                              setEmpresas(novasEmpresas);
                            }}
                          >
                            ✕ Remover empresa
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className={styles.addBtnRow}>
                    <button
                      type="button"
                      className={styles.addBtnSmall}
                      onClick={() => setEmpresas([...empresas, { nome: '', cargo: '', segmento: '', dataInicio: '', dataFim: '', descricao: '' }])}
                    >
                      {t("registration.ui.adicionar-outra-empresa")}
                    </button>
                  </div>
                </div>
            </>
          </BlocoCadastro>
          </>
          )}

          {showWizardStep(2) && (
          <>
          <RegisterExtendedSections
            formData={formData}
            setFormData={setFormData as React.Dispatch<React.SetStateAction<import('./RegisterExtendedSections').ExtendedFormFields & Record<string, unknown>>>}
            edicao={isEditMode ? { aberto: (id) => Boolean(blocosAbertos[id]), onEditar: abrirBloco } : null}
          />

          <BlocoCadastro {...propsBloco("apresentacao", "✍️", t("registration.ui.apresentacao-profissional"))}>
            
            <div className={`${styles.fieldGroup} ${styles.fieldWide}`}>
              <LabelMarcador htmlFor="mensagemEmpresas" marcador="recomendado">
                Mensagem para as empresas{' '}
                <span className={styles.labelHint}>{t("registration.ui.aproveite-pois-essa-e-a-sua-oportunidade-de-impressionar-que-vis")}</span>
              </LabelMarcador>
              <textarea
              id="mensagemEmpresas"
              className={`${styles.input} ${styles.textarea}`}
              rows={4}
              placeholder={t("registration.ui.conte-um-pouco-sobre-voce-seus-objetivos-profissionais-ou-qualqu")}
              value={formData.mensagemEmpresas}
              onChange={e => setFormData((prev) => ({ ...prev, mensagemEmpresas: e.target.value }))}
            ></textarea>
            </div>

            <div className={styles.formSubCard}>
              <p className={styles.sobreMimSubtitulo}>{t("registration.ui.sobre-mim")}</p>
              <RegisterSobreMimFields value={sobreMim} onChange={atualizarSobreMim} />
            </div>
          </BlocoCadastro>
          </>
          )}

          {showWizardStep(3) && (
          <>
          <BlocoCadastro {...propsBloco("video", "🎬", t("registration.ui.video-de-apresentacao"))}>
            <div className={styles.formSubCard}>
              <VideoApresentacaoCadastro />
            </div>
          </BlocoCadastro>

          {(isEditMode || !useWizard || wizardStep === lastWizardStep) && (
            <ResumeToolkit
              variant={isEditMode ? 'profile' : 'register'}
              focus={isEditMode ? 'full' : 'generate'}
              notice={t("registration.ui.nao-tem-um-curriculo-para-anexar-nao-tem-problema-geramos-seu-cu")}
              authenticated={Boolean(session?.user?.email)}
              getLocalDraft={montarRascunhoCurriculo}
              onDraftApplied={aplicarRascunhoCurriculo}
              onAttachFile={importarCurriculoArquivo}
              onHoldFile={(file) => {
                pendingResumeRef.current = file;
              }}
            />
          )}

          {exibirCamposSenha ? (
            <BlocoCadastro {...propsBloco("conta", "🔐", t("registration.ui.sua-conta-2"))}>
              <p className={styles.formHint}>
                {t("registration.ui.repita-email-senha")}
              </p>
              <div className={styles.contaLinha}>
                <div className={fg('email')}>
                  <label className={styles.label} htmlFor="emailRepetido">{t("registration.ui.repita-seu-e-mail")}</label>
                  <input
                    id="emailRepetido"
                    type="email"
                    required
                    className={styles.input}
                    value={emailRepetido}
                    onChange={(e) => setEmailRepetido(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className={fg('password')}>
                  <label className={styles.label} htmlFor="password">{t("registration.ui.senha-2")}</label>
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
                </div>
                <div className={fg('confirmPassword')}>
                  <label className={styles.label} htmlFor="confirmPassword">{t("registration.ui.confirmacao-de-senha")}</label>
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
                </div>
              </div>
              <label className={styles.checkboxLabel}>
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
              {emailError ? (
                <p className={styles.anexoCurriculoErro} role="alert">{emailError}</p>
              ) : null}
            </BlocoCadastro>
          ) : null}

          <BlocoCadastro {...propsBloco("termos", "📋", t("registration.ui.termos"))}>

            <div className={styles.formSubCard}>
              <RegisterTermoItem
                id="termoAutorizacaoDados"
                slug="autorizacao-dados"
                titulo={t("registration.ui.termo-de-autorizacao-de-uso-de-dados")}
                checked={formData.autorizoDados}
                onChange={(checked) => setFormData((prev) => ({ ...prev, autorizoDados: checked }))}
                className={termoErro('autorizoDados')}
              />

              <RegisterTermoItem
                id="termoDeclaracaoVeracidade"
                slug="declaracao-veracidade"
                titulo={t("registration.ui.termo-de-declaracao-de-veracidade")}
                checked={formData.declaroVerdadeiro}
                onChange={(checked) => setFormData((prev) => ({ ...prev, declaroVerdadeiro: checked }))}
                className={termoErro('declaroVerdadeiro')}
              />

              <RegisterTermoItem
                id="termoLgpd"
                slug="lgpd"
                titulo={t("registration.ui.termo-lgpd-tratamento-de-dados-pessoais")}
                checked={formData.aceitoLGPD}
                onChange={(checked) => setFormData((prev) => ({ ...prev, aceitoLGPD: checked }))}
                className={termoErro('aceitoLGPD')}
              />

              <p className={styles.avisoObrigatoriosTitulo} style={{ marginTop: 12, fontWeight: 500 }}>
                {t("legal.registrationLinksHint")}{" "}
                <a href="/termos/uso">{t("legal.linkTermsOfUse")}</a>
                {" · "}
                <a href="/termos/privacidade">{t("legal.linkPrivacy")}</a>
              </p>
            </div>
          </BlocoCadastro>
          </>
          )}

          {camposObrigatoriosFaltando.length > 0 && (!useWizard || wizardStep === lastWizardStep) && (
            <div id={useWizard ? 'aviso-obrigatorios-final' : 'aviso-obrigatorios'} className={styles.avisoObrigatoriosCard} role="alert" aria-live="polite">
              <p className={styles.avisoObrigatoriosTitulo}>
                {t("registration.ui.preencha-obrigatorios-salvar")}
              </p>
              <ul className={styles.avisoObrigatoriosLista}>
                {camposObrigatoriosFaltando.map((campo) => (
                  <li key={`${campo.id}-${campo.label}`}>{campo.label}</li>
                ))}
              </ul>
            </div>
          )}

          {useWizard && wizardStep < lastWizardStep && (
            <div className={styles.wizardNavFooter}>
              <button
                type="button"
                className={styles.wizardNavBtn}
                disabled={wizardStep <= 0}
                onClick={() => irWizard(wizardStep - 1)}
              >
                {t("registration.ui.voltar")}
              </button>
              <button
                type="button"
                className={styles.wizardNavBtnPrimary}
                onClick={() => irWizard(wizardStep + 1)}
              >
                {t("registration.ui.continuar")}
              </button>
            </div>
          )}

          {useWizard && wizardStep === lastWizardStep && (
            <div className={styles.wizardNavFooter}>
              <button
                type="button"
                className={styles.wizardNavBtn}
                onClick={() => irWizard(wizardStep - 1)}
              >
                {t("registration.ui.voltar")}
              </button>
              <button type="submit" className={styles.submitBtn}>
                {t("registration.ui.finalizar-meu-cadastro")}
              </button>
            </div>
          )}

          {!useWizard && (
          <div className={styles.submitBtnRow}>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {isEditMode
                ? (salvoNoBotao ? t("registration.ui.alteracoes-salvas") : submitting ? t("registration.ui.salvando") : t("registration.ui.salvar-alteracoes"))
                : t("registration.ui.finalizar-meu-cadastro")}
            </button>
          </div>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}