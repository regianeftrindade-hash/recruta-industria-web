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
import { LabelMarcador, TextoMarcador } from './RegisterLabelMarcador';
import RegisterTermoItem from './RegisterTermoItem';
import RegisterSobreMimFields from './RegisterSobreMimFields';
import { SOBRE_MIM_VAZIO, truncarSobreMim, type SobreMimData } from '@/lib/sobre-mim';
import { validarCamposObrigatoriosCadastro, type CampoObrigatorioFalta, type ValidacaoCadastroInput } from '@/lib/professional/cadastro-obrigatorios';
import { useCampoObrigatorioErro } from './useCampoObrigatorioErro';
import RegisterExtendedSections from './RegisterExtendedSections';
import PageLoader from '@/app/components/PageLoader';
import {
  calculateProfileCompletion,
  PREFIRO_NAO_INFORMAR,
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

function LegendaPreenchimento() {
  return (
    <div className={styles.legendaPreenchimentoCard}>
      <h3 className={styles.legendaPreenchimentoTitulo}>PREENCHIMENTO</h3>
      <div className={styles.legendaPreenchimentoLista}>
        <div className={styles.legendaPreenchimentoItem}>
          <span className={`${styles.legendaBolinha} ${styles.legendaBolinhaVermelha}`} aria-hidden />
          <span>Preenchimento obrigatório</span>
        </div>
        <div className={styles.legendaPreenchimentoItem}>
          <span className={`${styles.legendaBolinha} ${styles.legendaBolinhaAmarela}`} aria-hidden />
          <span>Preenchimento recomendado</span>
        </div>
      </div>
    </div>
  );
}

function CampoFotoPerfil({
  value,
  onFileSelect,
  centered = false,
}: {
  value: string | null;
  onFileSelect: (file: File) => Promise<void> | void;
  centered?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const temFoto = isFotoPerfilPreviewable(value);

  return (
    <div className={`${styles.fotoCampo} ${centered ? styles.fotoCampoCentro : ''}`}>
      <TextoMarcador marcador="recomendado">Foto de perfil</TextoMarcador>
      {temFoto && (
        <div className={styles.fotoComAnexo}>
          <img
            src={String(value)}
            alt="Foto de perfil"
            className={styles.avatarPreview}
            decoding="async"
          />
          <div className={styles.fotoAnexoLinha}>
            <span className={styles.anexoTextoInline}>✓ Foto de perfil anexada</span>
            <button type="button" className={styles.anexoBtn} onClick={() => inputRef.current?.click()}>
              Trocar foto
            </button>
          </div>
          {centered && <LegendaPreenchimento />}
        </div>
      )}
      {!temFoto && (
        <div className={centered ? styles.fotoComAnexo : undefined}>
          <div className={centered ? styles.fotoAnexoLinha : styles.anexoBtnRow}>
            <button
              type="button"
              className={styles.anexoBtn}
              onClick={() => inputRef.current?.click()}
            >
              Selecionar foto
            </button>
          </div>
          {centered && <LegendaPreenchimento />}
        </div>
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

const CURRICULO_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

function isCurriculoArquivoValido(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return (
    (CURRICULO_MIMES as readonly string[]).includes(file.type)
    || ext === 'pdf'
    || ext === 'docx'
  );
}

function CampoArquivoAnexo({
  id,
  label,
  accept,
  value,
  onFileSelect,
  textoBotaoVazio = 'Selecionar arquivo',
  textoBotaoInline = 'Anexar',
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
        <p className={styles.anexoFormatosHint}>Somente {formatosAceitos}</p>
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
              <span className={styles.anexoCampoPlaceholder}>Nenhum arquivo anexado</span>
            )}
          </div>
          <button
            type="button"
            className={styles.anexoCampoBtn}
            onClick={() => inputRef.current?.click()}
          >
            {anexado ? 'Trocar' : textoBotaoInline}
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
              Download
            </a>
          </div>
        ) : (
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

export default function CadastroProfissional() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const isEditMode = searchParams.get('edit') === '1';
  const [profileLoaded, setProfileLoaded] = useState(!isEditMode);
  const [checkingRegistration, setCheckingRegistration] = useState(!isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [camposObrigatoriosFaltando, setCamposObrigatoriosFaltando] = useState<CampoObrigatorioFalta[]>([]);
  const { fg, blocoErro, termoErro } = useCampoObrigatorioErro(camposObrigatoriosFaltando);
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
  const [cursos, setCursos] = useState<CursoDetalhado[]>([{ nome: '', possuiCertificado: false }]);
  const [certificacoes, setCertificacoes] = useState<CertificacaoDetalhada[]>([{ nome: '' }]);
  const [idiomas, setIdiomas] = useState<IdiomaEntry[]>([{ selecionado: '' }]);
  const [dataNascimentoValue, setDataNascimentoValue] = useState('');
  const [empresas, setEmpresas] = useState<{ nome: string; cargo: string; segmento: string; dataInicio: string; dataFim: string; descricao: string }[]>([
    { nome: '', cargo: '', segmento: '', dataInicio: '', dataFim: '', descricao: '' }
  ]);
  const [sobreMim, setSobreMim] = useState<SobreMimData>(SOBRE_MIM_VAZIO);

  const [formData, setFormData] = useState({
    nome: '', dataNascimento: '', idade: '', sexoBiologico: '', identidadeGenero: '', orientacaoSexual: '', estadoCivil: '', religiao: '', antecedentes: '',
    possuiFilhos: 'Não', quantidadeFilhos: '', faixaEtariaFilhos: [] as string[],
    email: '', telefone: '', telefone2: '', whatsapp: 'Não',
    estado: '', cidade: '', disponibilidadeMudanca: '',
    escolaridade: '', cursoFormacao: '', instituicaoFormacao: '', anoConclusaoFormacao: '', documentoFormacao: null as string | null, possuiCertificadoFormacao: false, cursosCertificacoes: '',
    situacaoProfissional: '', areaInteresse: '', cargoDesejado: '', nivelOperacional: '', areaNivel: '', detalheNivel: '', turnoDisponivel: '', disponibilidadeInicio: '',
    trabalhouIndustria: 'Não', tempoExperiencia: '', experiencias: '',
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

        if (data?.formEdit) {
          aplicarDadosDoPerfil(data.formEdit);
        }

        setFormData((prev) => ({
          ...prev,
          email: session.user?.email || prev.email,
          nome: String(prev.nome || '').trim() ? prev.nome : (session.user?.name || prev.nome),
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
    const salarioFormatado = 'R$ ' + inteiroFormatado + ',' + centavos;
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
    cpfError,
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
  }), [
    formData,
    cpf,
    cpfError,
    dataNascimentoValue,
    telefone,
    telefone2,
    pretensaoSalarial,
    empresas,
    password,
    confirmPassword,
    isEditMode,
    cadastroComGoogle,
  ]);

  useEffect(() => {
    if (camposObrigatoriosFaltando.length === 0) return;

    const faltando = validarCamposObrigatoriosCadastro(montarInputValidacao());
    setCamposObrigatoriosFaltando(faltando);

    if (formData.email && isValidEmail(formData.email)) {
      setEmailError('');
    }
  }, [montarInputValidacao, camposObrigatoriosFaltando.length]);

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

    const liveSession = await getSession();
    const sessionEmail = liveSession?.user?.email?.toLowerCase().trim() || '';
    const formEmail = formData.email.toLowerCase().trim();
    const sessaoAtiva = emailsConferem(sessionEmail, formEmail);

    const faltando = validarCamposObrigatoriosCadastro(montarInputValidacao());

    if (faltando.length > 0) {
      setCamposObrigatoriosFaltando(faltando);
      if (!formData.email || !isValidEmail(formData.email)) {
        setEmailError('Email é obrigatório e deve ser válido');
      }
      requestAnimationFrame(() => {
        document.getElementById('aviso-obrigatorios')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    setCamposObrigatoriosFaltando([]);
    setEmailError('');

    if (sessionEmail && formEmail && !sessaoAtiva) {
      alert(
        `Você está logado como ${sessionEmail}, mas o cadastro é para ${formEmail}. Saia da conta atual e tente novamente.`,
      );
      return;
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

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
          alert('Sessão expirada. Entre com Google novamente e complete o cadastro.');
          router.push('/login?tipo=profissional');
          return;
        }

        if (!profileRes.ok) {
          throw new Error(String(profileData.error || 'Erro ao salvar perfil'));
        }

        if (profileData.success) {
          await salvarSobreMimPerfil();
          salvarBackupLocal({
            ...dadosParaSalvar,
            sobreMim,
            dataNascimentoDisplay: dataNascimentoValue,
          });
          localStorage.removeItem('dadosCadastroSimples');
          if (isEditMode) {
            if (mensagemSucesso) alert(mensagemSucesso);
            router.push('/professional/dashboard');
          } else {
            router.push('/professional/boas-vindas');
          }
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
        router.push('/professional/boas-vindas');
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
          router.push('/professional/boas-vindas');
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

          <CampoFotoPerfil
            centered
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
          
          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="🏭" title="Dados pessoais" />
            
            <div className={styles.fieldsRow}>
              <div className={fg('nome')}>
                <LabelMarcador htmlFor="nome" marcador="obrigatorio">Nome completo</LabelMarcador>
                <input
                  id="nome"
                  type="text"
                  required
                  className={styles.input}
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                />
              </div>

              <div className={fg('cpf')}>
                <LabelMarcador htmlFor="cpf" marcador="obrigatorio">CPF</LabelMarcador>
                <div className={styles.inputIndicatorWrap}>
                  {!cpfValidating && cpf.length === 14 && !cpfError && (
                    <span className={`${styles.cpfIndicator} ${styles.cpfIndicatorOk}`} aria-label="CPF válido">✓</span>
                  )}
                  {!cpfValidating && cpfError && cpf.length === 14 && (
                    <span className={`${styles.cpfIndicator} ${styles.cpfIndicatorError}`} aria-label="CPF inválido">✕</span>
                  )}
                  <input
                    id="cpf"
                    type="text"
                    required
                    className={`${styles.input} ${styles.inputWithIndicator}`}
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
                </div>
              </div>

              <div className={fg('dataNascimento')}>
                <LabelMarcador htmlFor="dataNascimento" marcador="obrigatorio" className={styles.labelComHint}>
                  Nascimento <span className={styles.labelHint}>(DD/MM/AAAA)</span>
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
                <label className={styles.label} htmlFor="idade">Idade</label>
                <input id="idade" type="text" className={styles.input} value={formData.idade} onChange={e => setFormData((prev) => ({ ...prev, idade: e.target.value }))} />
              </div>

              <div className={fg('sexoBiologico')}>
                <LabelMarcador htmlFor="sexoBiologico" marcador="obrigatorio">Sexo biológico</LabelMarcador>
                <div className={styles.selectWrap}>
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
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="identidadeGenero">Identidade de gênero</label>
                <div className={styles.selectWrap}>
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

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="orientacaoSexual">Orientação sexual</label>
                <div className={styles.selectWrap}>
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
              </div>

              <div className={fg('estadoCivil')}>
                <LabelMarcador htmlFor="estadoCivil" marcador="obrigatorio">Estado civil</LabelMarcador>
                <div className={styles.selectWrap}>
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

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="religiao">Religião</label>
                <div className={styles.selectWrap}>
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
              </div>

              <div className={fg('possuiCNH')}>
                <LabelMarcador htmlFor="possuiCNH" marcador="obrigatorio">Possui CNH?</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="possuiCNH"
                    className={styles.select}
                    value={formData.possuiCNH}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      possuiCNH: e.target.value,
                      categoriaCNH: e.target.value === 'Não' ? '' : prev.categoriaCNH,
                      cnhDocumento: e.target.value === 'Não' ? null : prev.cnhDocumento,
                    }))}
                  >
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                    <option value={PREFIRO_NAO_INFORMAR}>{PREFIRO_NAO_INFORMAR}</option>
                  </select>
                </div>
              </div>

              {formData.possuiCNH === 'Sim' && (
                <div className={fg('categoriaCNH')}>
                  <LabelMarcador htmlFor="categoriaCNH" marcador="obrigatorio">Categoria da CNH</LabelMarcador>
                  <div className={styles.selectWrap}>
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
                  </div>
                </div>
              )}

              <div className={fg('antecedentes')}>
                <LabelMarcador htmlFor="antecedentes" marcador="obrigatorio">Antecedentes criminais</LabelMarcador>
                <div className={styles.selectWrap}>
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
            </div>

            {formData.possuiCNH === 'Sim' && (
              <div className={styles.fieldsRow}>
                <div className={`${styles.fieldGroup} ${styles.fieldWide}`}>
                  <CampoArquivoAnexo
                    id="cnhDocumento"
                    label="Certificado da CNH (opcional)"
                    accept=".pdf,.jpg,.jpeg,.png"
                    value={formData.cnhDocumento}
                    textoBotaoVazio="Selecionar certificado da CNH"
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
                  nome: 'Atestado de antecedentes',
                  possuiCertificado: formData.possuiAtestadoAntecedentes || Boolean(formData.atestado),
                  certificadoUrl: formData.atestado ?? undefined,
                }}
                checkboxLabel="Anexo de antecedentes criminais (Opcional)"
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
          </section>

          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="👨‍👩‍👧‍👦" title="Filhos" />

            <div className={styles.fieldsRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="possuiFilhos">Possui filhos?</label>
                <div className={styles.selectWrap}>
                  <select id="possuiFilhos" className={styles.select} value={formData.possuiFilhos} onChange={e => setFormData((prev) => ({ ...prev, possuiFilhos: e.target.value }))}>
                    <option value="">Selecione</option>
                    <option>Não</option>
                    <option>Sim</option>
                  </select>
                </div>
              </div>

              {formData.possuiFilhos === 'Sim' && (
                <>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="quantidadeFilhos">Quantidade de filhos</label>
                    <div className={styles.selectWrap}>
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
                    </div>
                  </div>

                  <div className={`${styles.fieldGroup} ${styles.fieldSpan2}`}>
                    <span className={styles.label}>Faixa etária dos filhos</span>
                    <div className={styles.tagFieldBox}>
                      <div className={styles.tagList}>
                        {['Menos de 1', '1 a 3', '3 a 5', '5 a 7', '7 a 9', '9 a 12', 'Acima de 12'].map((faixa) => {
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
          </section>

          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="📞" title="Contato" />

            <div className={styles.fieldsRow}>
              <div className={fg('email')}>
                <LabelMarcador htmlFor="email" marcador="obrigatorio">E-mail</LabelMarcador>
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
              </div>
              <div className={fg('telefone')}>
                <LabelMarcador htmlFor="telefone" marcador="obrigatorio">Telefone / WhatsApp (DDD)</LabelMarcador>
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
              <div className={fg('whatsapp')}>
                <LabelMarcador htmlFor="whatsapp" marcador="obrigatorio">Este número é WhatsApp?</LabelMarcador>
                <div className={styles.selectWrap}>
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
              <div className={styles.fieldGroup}>
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
            {emailError && (
              <div className={styles.fieldNotice}>
                <span style={{ color: '#dc3545', fontSize: '12px' }}>❌ {emailError}</span>
              </div>
            )}

            {cadastroComGoogle && (
              <p style={{ color: '#F2F2F2', fontSize: 13, margin: '0 0 12px' }}>
                Você entrou com Google. Não é necessário criar senha.
              </p>
            )}

            {exibirCamposSenha && (
              <div className={styles.fieldsRow}>
                <div className={fg('password')}>
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
                </div>
                <div className={fg('confirmPassword')}>
                  <label className={styles.label} htmlFor="confirmPassword">Confirmar senha *</label>
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
                <div className={styles.fieldGroup} style={{ alignSelf: 'end' }}>
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
                </div>
              </div>
            )}

          </section>

          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="📍" title="Localização" />

            <div className={styles.fieldsRow}>
              <div className={fg('estado')}>
                <LabelMarcador htmlFor="estado" marcador="obrigatorio">Estado (UF)</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select id="estado" className={styles.select} required value={formData.estado} onChange={e => setFormData((prev) => ({ ...prev, estado: e.target.value }))}>
                    <option value="">Selecione</option>
                    {listaEstados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              <div className={fg('cidade')}>
                <LabelMarcador htmlFor="cidade" marcador="obrigatorio">Cidade</LabelMarcador>
                <div className={styles.selectWrap}>
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
              <div className={fg('disponibilidadeMudanca')}>
                <LabelMarcador htmlFor="disponibilidadeMudanca" marcador="obrigatorio">Disponibilidade para mudança</LabelMarcador>
                <div className={styles.selectWrap}>
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
                </div>
              </div>
              <div className={fg('aceitaViagens')}>
                <LabelMarcador htmlFor="aceitaViagens" marcador="obrigatorio">Disponibilidade para viagens</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="aceitaViagens"
                    className={styles.select}
                    value={formData.aceitaViagens}
                    onChange={e => setFormData((prev) => ({ ...prev, aceitaViagens: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                    <option value="Dependendo">Dependendo</option>
                    <option value={PREFIRO_NAO_INFORMAR}>{PREFIRO_NAO_INFORMAR}</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="🎓" title="Formação" />

            <div className={styles.formSubCards}>
              <div className={styles.formSubCard}>
                <TextoMarcador>Escolaridade</TextoMarcador>
                <div className={styles.fieldsRow}>
                  <div className={fg('escolaridade')}>
                    <LabelMarcador htmlFor="escolaridade" marcador="obrigatorio">Nível</LabelMarcador>
                    <div className={styles.selectWrap}>
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
                    </div>
                  </div>
                  <div className={fg('cursoFormacao')}>
                    <LabelMarcador htmlFor="cursoFormacao" marcador="obrigatorio">Curso</LabelMarcador>
                    <input
                      id="cursoFormacao"
                      type="text"
                      className={styles.input}
                      placeholder="Ex.: 2º Ano / Medicina"
                      value={formData.cursoFormacao}
                      onChange={e => setFormData((prev) => ({ ...prev, cursoFormacao: e.target.value }))}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <LabelMarcador htmlFor="instituicaoFormacao" marcador="recomendado">Instituição</LabelMarcador>
                    <input
                      id="instituicaoFormacao"
                      type="text"
                      className={styles.input}
                      placeholder="Ex.: SENAI, UFPR"
                      value={formData.instituicaoFormacao}
                      onChange={e => setFormData((prev) => ({ ...prev, instituicaoFormacao: e.target.value }))}
                    />
                  </div>
                  <div className={fg('anoConclusaoFormacao')}>
                    <LabelMarcador htmlFor="anoConclusaoFormacao" marcador="obrigatorio">Ano de conclusão</LabelMarcador>
                    <input
                      id="anoConclusaoFormacao"
                      type="number"
                      className={styles.input}
                      placeholder="Ex.: 2020"
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
                  checkboxLabel="Anexar histórico / Declaração / Certificado (Opcional)"
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
                <TextoMarcador marcador="recomendado">Cursos</TextoMarcador>
                <p style={{ margin: 0, fontSize: 11, color: '#999', lineHeight: 1.45 }}>
                  Preencha os cursos que você concluiu. O upload do certificado é opcional.
                </p>
                <datalist id="cursosIndustriaisSugeridos">
                  {CURSOS_INDUSTRIAIS_SUGERIDOS.map((c) => (
                    <option key={c} value={c} />
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
                        <label className={styles.label}>Nome do curso</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Ex.: NR-11, Metrologia..."
                          list="cursosIndustriaisSugeridos"
                          value={curso.nome}
                          onChange={(e) => atualizar({ nome: e.target.value })}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Instituição</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Ex.: SENAI"
                          value={curso.instituicao ?? ''}
                          onChange={(e) => atualizar({ instituicao: e.target.value })}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Carga horária</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Ex.: 40h"
                          value={curso.cargaHoraria ?? ''}
                          onChange={(e) => atualizar({ cargaHoraria: e.target.value })}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Conclusão</label>
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
                            aria-label="Remover curso"
                          >
                            ✕ Remover curso
                          </button>
                        </div>
                      )}
                    </div>
                    <CertificadoCursoUpload
                      curso={curso}
                      checkboxLabel="Anexar certificado (Opcional)"
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
                    + Adicionar outro curso
                  </button>
                </div>
              </div>

              <div className={styles.formSubCard}>
                <TextoMarcador marcador="recomendado">Certificações</TextoMarcador>
                {certificacoes.map((cert, index) => {
                  const atualizar = (patch: Partial<CertificacaoDetalhada>) => {
                    setCertificacoes((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
                  };
                  return (
                    <div key={index} className={styles.cursoItem}>
                      <div className={styles.fieldsRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Nome da certificação</label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Ex.: ISO 9001 Lead Auditor"
                            value={cert.nome}
                            onChange={(e) => atualizar({ nome: e.target.value })}
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Emissor</label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Ex.: Bureau Veritas"
                            value={cert.emissor ?? ''}
                            onChange={(e) => atualizar({ emissor: e.target.value })}
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Validade</label>
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
                              aria-label="Remover certificação"
                            >
                              ✕ Remover certificação
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
                        checkboxLabel="Anexar certificado (Opcional)"
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
                    + Adicionar certificação
                  </button>
                </div>
              </div>

              <div className={styles.formSubCard}>
                <TextoMarcador marcador="recomendado">Idiomas</TextoMarcador>
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
                          <option value="">Selecione o idioma</option>
                          {IDIOMAS_OPCOES.map((opcao) => (
                            <option key={opcao} value={opcao}>{opcao}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {idioma.selecionado === 'Outros' && (
                      <div className={styles.fieldGroup} style={{ marginBottom: 0 }}>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Digite o idioma"
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
                        aria-label="Remover idioma"
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
                      + Adicionar idioma
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="💼" title="Perfil profissional" />

            <div className={styles.fieldsRow}>
              <div className={fg('situacaoProfissional')}>
                <LabelMarcador htmlFor="situacaoProfissional" marcador="obrigatorio">Situação profissional atual</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="situacaoProfissional"
                    className={styles.select}
                    required
                    value={formData.situacaoProfissional}
                    onChange={(e) => setFormData((prev) => ({ ...prev, situacaoProfissional: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    <option value="Empregado">Empregado</option>
                    <option value="Desempregado">Desempregado</option>
                    <option value="Primeiro emprego">Primeiro emprego</option>
                    <option value="Jovem Aprendiz (16 a 18)">Jovem Aprendiz (16 a 18)</option>
                  </select>
                </div>
              </div>

              <div className={fg('areaInteresse')}>
                <LabelMarcador htmlFor="areaInteresse" marcador="obrigatorio">Área de interesse</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="areaInteresse"
                    className={styles.select}
                    required
                    value={formData.areaInteresse}
                    onChange={(e) => setFormData((prev) => ({ ...prev, areaInteresse: e.target.value }))}
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
              </div>

              <div className={fg('nivelOperacional')}>
                <LabelMarcador htmlFor="nivelOperacional" marcador="obrigatorio">Nível operacional</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="nivelOperacional"
                    className={styles.select}
                    required
                    value={formData.nivelOperacional}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      nivelOperacional: e.target.value,
                      areaNivel: '',
                      detalheNivel: '',
                    }))}
                  >
                    <option value="">Selecione</option>
                    {NIVEIS_OPERACIONAIS.map((nivel) => (
                      <option key={nivel} value={nivel}>{nivel}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.nivelOperacional && (
                <div className={fg('areaNivel')}>
                  <LabelMarcador htmlFor="areaNivel" marcador="obrigatorio">Área Operacional</LabelMarcador>
                  <div className={styles.selectWrap}>
                    <select
                      id="areaNivel"
                      className={styles.select}
                      value={formData.areaNivel}
                      onChange={(e) => setFormData((prev) => ({ ...prev, areaNivel: e.target.value }))}
                    >
                      <option value="">Selecione</option>
                      {AREAS_COMPLEMENTO_NIVEL.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className={fg('cargoDesejado')}>
                <LabelMarcador htmlFor="cargoDesejado" marcador="obrigatorio">Cargo desejado</LabelMarcador>
                <input
                  id="cargoDesejado"
                  type="text"
                  required
                  className={styles.input}
                  placeholder="Ex.: Operador de CNC, Inspetor de Qualidade"
                  value={formData.cargoDesejado}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cargoDesejado: e.target.value }))}
                />
              </div>

              <div className={fg('turnoDisponivel')}>
                <LabelMarcador htmlFor="turnoDisponivel" marcador="obrigatorio">Turno disponível</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="turnoDisponivel"
                    className={styles.select}
                    value={formData.turnoDisponivel}
                    onChange={(e) => setFormData((prev) => ({ ...prev, turnoDisponivel: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    <option value="1º Turno">Primeiro</option>
                    <option value="2º Turno">Segundo</option>
                    <option value="3º Turno">Terceiro</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>
              </div>
              <div className={fg('disponibilidadeInicio')}>
                <LabelMarcador htmlFor="disponibilidadeInicio" marcador="obrigatorio">Disponibilidade para início</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="disponibilidadeInicio"
                    className={styles.select}
                    value={formData.disponibilidadeInicio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, disponibilidadeInicio: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    <option value="Imediata">Imediata</option>
                    <option value="15 dias">15 dias</option>
                    <option value="30 dias">30 dias</option>
                    <option value="2 meses">2 meses</option>
                  </select>
                </div>
              </div>
              <div className={fg('pretensaoSalarial')}>
                <LabelMarcador htmlFor="pretensaoSalarial" marcador="obrigatorio">Pretensão salarial</LabelMarcador>
                <input
                  id="pretensaoSalarial"
                  type="text"
                  className={styles.input}
                  placeholder="Ex: R$ 2.500,00"
                  value={pretensaoSalarial}
                  onChange={(e) => formatSalario(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="💼" title="Experiência na indústria" />

            <div className={styles.fieldsRow}>
              <div className={fg('trabalhouIndustria')}>
                <LabelMarcador htmlFor="trabalhouIndustria" marcador="obrigatorio">Trabalhou na indústria?</LabelMarcador>
                <div className={styles.selectWrap}>
                  <select
                    id="trabalhouIndustria"
                    className={styles.select}
                    required
                    value={formData.trabalhouIndustria}
                    onChange={(e) => setFormData((prev) => ({ ...prev, trabalhouIndustria: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    <option value="Não">Não</option>
                    <option value="Primeiro emprego">Primeiro emprego</option>
                    <option value="Jovem aprendiz">Jovem aprendiz</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
              </div>

            {formData.trabalhouIndustria === 'Sim' && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="tempoExperiencia">Tempo total de experiência</label>
                <div className={styles.selectWrap}>
                  <select
                    id="tempoExperiencia"
                    className={styles.select}
                    value={formData.tempoExperiencia}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tempoExperiencia: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    <option value="Menos de 1 ano">Menos de 1 ano</option>
                    <option value="1-2 anos">1-2 anos</option>
                    <option value="3-5 anos">3-5 anos</option>
                    <option value="6-10 anos">6-10 anos</option>
                    <option value="Mais de 10 anos">Mais de 10 anos</option>
                  </select>
                </div>
              </div>
            )}
            </div>

            {formData.trabalhouIndustria === 'Sim' && (
              <>
                <TextoMarcador marcador="obrigatorio">Experiências profissionais</TextoMarcador>
                <div className={blocoErro('experiencias')} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {empresas.map((empresa, index) => (
                    <div
                      key={index}
                      className={index === 0 ? blocoErro('experiencias') : undefined}
                      style={{ border: '1px solid #8D6B1F', padding: '15px', borderRadius: '4px', backgroundColor: '#2B2B2B' }}
                    >
                      <p style={{ margin: '0 0 10px', fontWeight: 'bold', color: '#C89B3C' }}>Empresa {index + 1}</p>
                      <div className={styles.fieldsRow}>
                        <div className={index === 0 ? fg('experiencias') : styles.fieldGroup}>
                          <label className={styles.label}>Nome da empresa</label>
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
                        <div className={index === 0 ? fg('experiencias') : styles.fieldGroup}>
                          <label className={styles.label}>Cargo</label>
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
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Segmento</label>
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
                              <option value="">Selecione o segmento</option>
                              {SEGMENTOS_INDUSTRIA.map((seg) => (
                                <option key={seg} value={seg}>{seg}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Início (Mês/Ano)</label>
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
                          <label className={styles.label}>Fim (Mês/Ano)</label>
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
                      <div className={`${styles.fieldGroup} ${styles.fieldWide}`}>
                        <label className={styles.label}>Descreva</label>
                        <textarea
                          className={`${styles.input} ${styles.textarea}`}
                          rows={3}
                          placeholder="Descreva suas atividades, responsabilidades e conquistas nesta empresa..."
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
                      + Adicionar outra empresa
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <RegisterExtendedSections
            formData={formData}
            setFormData={setFormData as React.Dispatch<React.SetStateAction<import('./RegisterExtendedSections').ExtendedFormFields & Record<string, unknown>>>}
          />

          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="✍️" title="Apresentação profissional" />
            
            <div className={`${styles.fieldGroup} ${styles.fieldWide}`}>
              <LabelMarcador htmlFor="mensagemEmpresas" marcador="recomendado">
                Mensagem para as empresas{' '}
                <span className={styles.labelHint}>( Aproveite pois essa é a sua oportunidade de impressionar que visualizar seu perfil.</span>
              </LabelMarcador>
              <textarea
              id="mensagemEmpresas"
              className={`${styles.input} ${styles.textarea}`}
              rows={4}
              placeholder="Conte um pouco sobre você, seus objetivos profissionais ou qualquer informação que gostaria que as empresas soubessem..."
              value={formData.mensagemEmpresas}
              onChange={e => setFormData((prev) => ({ ...prev, mensagemEmpresas: e.target.value }))}
            ></textarea>
            </div>

            <div className={styles.formSubCard}>
              <p className={styles.sobreMimSubtitulo}>Sobre mim</p>
              <RegisterSobreMimFields value={sobreMim} onChange={atualizarSobreMim} />
            </div>
          </section>

          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="📄" title="Currículo" />

            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#bbb', lineHeight: 1.45 }}>
              Anexe seu currículo em arquivo. Apenas PDF e DOCX são aceitos.
            </p>
            <div className={styles.formSubCard}>
              <CampoArquivoAnexo
                id="curriculo"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                value={formData.curriculo}
                textoBotaoVazio="Selecionar currículo (PDF ou DOCX)"
                onFileSelect={async (file) => {
                  if (!isCurriculoArquivoValido(file)) {
                    alert('Formato não permitido. Envie o currículo em PDF ou DOCX.');
                    return;
                  }
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
            </div>

          </section>

          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="🎬" title="Vídeo de apresentação" />
            <div className={styles.formSubCard}>
              <VideoApresentacaoCadastro />
            </div>
          </section>

          <section className={styles.sectionCard}>
            <RegisterSectionHeader emoji="📋" title="Termos" />

            <div className={styles.formSubCard}>
              <RegisterTermoItem
                id="termoAutorizacaoDados"
                slug="autorizacao-dados"
                titulo="Termo de Autorização de Uso de Dados"
                checked={formData.autorizoDados}
                onChange={(checked) => setFormData((prev) => ({ ...prev, autorizoDados: checked }))}
                className={termoErro('autorizoDados')}
              />

              <RegisterTermoItem
                id="termoDeclaracaoVeracidade"
                slug="declaracao-veracidade"
                titulo="Termo de Declaração de Veracidade"
                checked={formData.declaroVerdadeiro}
                onChange={(checked) => setFormData((prev) => ({ ...prev, declaroVerdadeiro: checked }))}
                className={termoErro('declaroVerdadeiro')}
              />

              <RegisterTermoItem
                id="termoLgpd"
                slug="lgpd"
                titulo="Termo LGPD — Tratamento de Dados Pessoais"
                checked={formData.aceitoLGPD}
                onChange={(checked) => setFormData((prev) => ({ ...prev, aceitoLGPD: checked }))}
                className={termoErro('aceitoLGPD')}
              />
            </div>
          </section>

          {camposObrigatoriosFaltando.length > 0 && (
            <div id="aviso-obrigatorios" className={styles.avisoObrigatoriosCard} role="alert" aria-live="polite">
              <p className={styles.avisoObrigatoriosTitulo}>
                Preencha todos os campos obrigatórios antes de salvar:
              </p>
              <ul className={styles.avisoObrigatoriosLista}>
                {camposObrigatoriosFaltando.map((campo) => (
                  <li key={`${campo.id}-${campo.label}`}>{campo.label}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.submitBtnRow}>
            <button type="submit" className={styles.submitBtn}>
              {isEditMode ? 'Salvar alterações' : 'Finalizar meu cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}