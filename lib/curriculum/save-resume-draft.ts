import { prisma } from "@/lib/db";
import { saveProfileFormSnapshot } from "@/lib/profile/profile-snapshot";
import { parseJsonSafe } from "@/lib/professional/professional-profile-map";
import type { ResumeDraft } from "@/lib/curriculum/resume-draft";

function snapshotObject(raw: string | null | undefined): Record<string, unknown> {
  const parsed = parseJsonSafe<Record<string, unknown> | null>(raw, null);
  return parsed && typeof parsed === "object" ? { ...parsed } : {};
}

function preserveCourses(previous: unknown, names: string[]): unknown[] {
  const rows = Array.isArray(previous) ? previous : [];
  return names.map((nome) => {
    const found = rows.find((item) => {
      if (typeof item === "string") return item.trim() === nome;
      if (item && typeof item === "object") return String((item as { nome?: string }).nome || "").trim() === nome;
      return false;
    });
    if (found && typeof found === "object") return { ...(found as Record<string, unknown>), nome };
    return { nome };
  });
}

/** Grava no perfil somente os campos do rascunho. Não mexe em plano, pagamento nem no arquivo. */
export async function saveResumeDraft(userId: string, email: string, draft: ResumeDraft): Promise<void> {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  const previous = snapshotObject(existing?.formDataJSON);
  const cursos = preserveCourses(previous.cursosDetalhados ?? previous.cursos ?? previous.cursosCertificacoes, draft.cursos);
  const empresas = draft.experiencias.map((item) => ({
    nome: item.empresa,
    cargo: item.cargo,
    segmento: item.segmento,
    dataInicio: item.inicio,
    dataFim: item.fim,
    descricao: item.atividades,
  }));
  const location = [draft.cidade, draft.estado].filter(Boolean).join(", ")
    || existing?.location
    || "Não informado";

  const nextSnapshot: Record<string, unknown> = {
    ...previous,
    nome: draft.nome,
    email: draft.email || email,
    telefone: draft.telefone,
    cidade: draft.cidade,
    estado: draft.estado,
    cargoDesejado: draft.objetivo,
    mensagemEmpresas: draft.resumo,
    escolaridade: draft.escolaridade,
    cursoFormacao: draft.curso,
    instituicaoFormacao: draft.instituicao,
    anoConclusaoFormacao: draft.ano,
    idiomas: draft.idiomas,
    empresas,
    experiencias: empresas,
    cursos: draft.cursos,
    cursosDetalhados: cursos,
    cursosCertificacoes: draft.cursos,
    maquinasEquipamentos: draft.habilidades,
    qualidadeProcessos: [],
    informatica: [],
    categoriaCNH: draft.cnh,
  };
  if (draft.cnh) {
    nextSnapshot.possuiCNH = "Sim";
  }

  const data = {
    title: draft.objetivo || existing?.title || "Profissional",
    bio: draft.resumo || null,
    mensagemEmpresas: draft.resumo || null,
    cargoDesejado: draft.objetivo || null,
    location,
    phone: draft.telefone || null,
    email: draft.email || existing?.email || email,
    cidade: draft.cidade || null,
    estado: draft.estado || null,
    escolaridade: draft.escolaridade || null,
    skills: draft.habilidades.length ? JSON.stringify(draft.habilidades) : null,
    experienciasJSON: empresas.length ? JSON.stringify(empresas) : null,
    cursosCertificacoes: cursos.length ? JSON.stringify(cursos) : null,
  };

  if (draft.nome) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: draft.nome },
    });
  }

  if (existing) {
    await prisma.profile.update({ where: { id: existing.id }, data });
  } else {
    await prisma.profile.create({
      data: {
        userId,
        ...data,
        title: data.title,
        location,
      },
    });
  }

  await saveProfileFormSnapshot(userId, JSON.stringify(nextSnapshot));
}
