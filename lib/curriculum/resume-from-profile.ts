import { parseJsonSafe } from "@/lib/professional/professional-profile-map";
import {
  emptyResumeDraft,
  sanitizeResumeDraft,
  type ResumeDraft,
  type ResumeExperience,
} from "@/lib/curriculum/resume-draft";

type ProfileSource = {
  cidade?: string | null;
  estado?: string | null;
  location?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  bio?: string | null;
  mensagemEmpresas?: string | null;
  cargoDesejado?: string | null;
  title?: string | null;
  escolaridade?: string | null;
  cursosCertificacoes?: string | null;
  skills?: string | null;
  experienciasJSON?: string | null;
  formDataJSON?: string | null;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string") return item.trim() ? [item.trim()] : [];
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const nome = text(row.nome) || text(row.selecionado);
        return nome ? [nome] : [];
      }
      return [];
    });
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = parseJsonSafe<unknown>(value, null);
    if (parsed) return list(parsed);
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function experiences(value: unknown): ResumeExperience[] {
  const rows = Array.isArray(value) ? value : [];
  return rows.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const empresa = text(row.nome) || text(row.empresa);
    const cargo = text(row.cargo);
    const inicio = text(row.dataInicio) || text(row.inicio);
    const fim = text(row.dataFim) || text(row.fim);
    const atividades = text(row.descricao) || text(row.atividades);
    const segmento = text(row.segmento);
    if (!empresa && !cargo && !atividades) return [];
    return [{ empresa, cargo, inicio, fim, atividades, segmento }];
  });
}

function snapshotOf(raw: string | null | undefined): Record<string, unknown> {
  const parsed = parseJsonSafe<Record<string, unknown> | null>(raw, null);
  if (!parsed || typeof parsed !== "object") return {};
  const nested = parsed.formData;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...(nested as Record<string, unknown>), ...parsed };
  }
  return parsed;
}

/** Monta o rascunho só com o que já está no perfil. Não completa lacunas. */
export function draftFromProfile(input: {
  name?: string | null;
  email?: string | null;
  profile?: ProfileSource | null;
}): ResumeDraft {
  const profile = input.profile;
  if (!profile && !input.name && !input.email) return emptyResumeDraft();
  const snap = snapshotOf(profile?.formDataJSON);
  const cidade = text(profile?.cidade) || text(snap.cidade);
  const estado = text(profile?.estado) || text(snap.estado);
  const localParts = text(profile?.location).split(",").map((part) => part.trim());
  const phone = text(profile?.phone) || text(snap.telefone);
  const whatsapp = text(profile?.whatsapp);
  const telefone = phone || (whatsapp && whatsapp !== "Sim" && whatsapp !== "Não" ? whatsapp : "");
  const idiomas = list(snap.idiomasDetalhados ?? snap.idiomas);
  const habilidades = list(profile?.skills).filter(
    (item) => !idiomas.some((idioma) => idioma.localeCompare(item, "pt-BR", { sensitivity: "accent" }) === 0),
  );
  const cnhRaw = text(snap.categoriaCNH) || text(snap.cnh);
  const possui = text(snap.possuiCNH);
  const cnh = possui === "Não" || /prefiro não informar/i.test(possui) || /prefiro não informar/i.test(cnhRaw)
    ? ""
    : cnhRaw;

  return sanitizeResumeDraft({
    nome: text(input.name) || text(snap.nome),
    cidade: cidade || (!estado && localParts.length > 1 ? localParts[0] : cidade),
    estado: estado || (localParts.length > 1 ? localParts[localParts.length - 1] : ""),
    telefone,
    email: text(profile?.email) || text(input.email) || text(snap.email),
    objetivo: text(profile?.cargoDesejado) || text(snap.cargoDesejado) || "",
    resumo: text(profile?.mensagemEmpresas) || text(profile?.bio) || text(snap.mensagemEmpresas),
    escolaridade: text(profile?.escolaridade) || text(snap.escolaridade),
    curso: text(snap.cursoFormacao),
    instituicao: text(snap.instituicaoFormacao),
    ano: text(snap.anoConclusaoFormacao),
    experiencias: experiences(
      parseJsonSafe<unknown>(profile?.experienciasJSON, null) || snap.empresas || snap.experiencias,
    ),
    cursos: list(profile?.cursosCertificacoes || snap.cursosDetalhados || snap.cursos || snap.cursosCertificacoes),
    habilidades,
    idiomas,
    cnh,
  });
}
