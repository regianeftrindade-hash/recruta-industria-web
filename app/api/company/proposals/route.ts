import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import { getCompanyPlanContext } from "@/lib/company-plan";
import { canCompanyAccessSensitiveProfiles } from "@/lib/company-storage";
import {
  createJobProposal,
  listProposalsForCompanyProfile,
} from "@/lib/company/job-proposals";
import { formatReaisDisplay } from "@/lib/format-reais";
import { TURNOS_PROPOSTA } from "@/lib/format-reais";
import {
  notifyProfessionalAsync,
  notifyProposalReceived,
} from "@/lib/professional-notifications";

async function getCompanyUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  const user = await prisma.user.findUnique({
    where: { email: auth.email },
    include: { company: true },
  });
  if (!user || user.role !== "COMPANY") return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    await ensurePaymentSchema();
    const companyUser = await getCompanyUser(request);
    if (!companyUser) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const profileId = request.nextUrl.searchParams.get("profileId")?.trim() || "";
    if (!profileId) {
      return NextResponse.json({ error: "profileId obrigatório" }, { status: 400 });
    }

    const plan = await getCompanyPlanContext(companyUser.id);
    const ownerUserId = plan.ownerUserId || companyUser.id;
    const proposals = await listProposalsForCompanyProfile(ownerUserId, profileId);
    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Erro ao listar propostas:", error);
    return NextResponse.json({ error: "Erro ao listar propostas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensurePaymentSchema();
    const companyUser = await getCompanyUser(request);
    if (!companyUser) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const plan = await getCompanyPlanContext(companyUser.id);
    if (!plan.features.canSendProposals) {
      return NextResponse.json(
        { error: "Envio de propostas disponível a partir do plano Basic." },
        { status: 403 },
      );
    }

    if (!(await canCompanyAccessSensitiveProfiles(companyUser.id))) {
      return NextResponse.json(
        { error: "Confirme o e-mail corporativo e aguarde a aprovação do cartão CNPJ." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const profileId = String(body?.profileId ?? "").trim();
    const cargo = String(body?.cargo ?? "").trim();
    const salario = formatReaisDisplay(String(body?.salario ?? "").trim());
    const turno = String(body?.turno ?? "").trim();
    const cidade = String(body?.cidade ?? "").trim();
    const beneficios = String(body?.beneficios ?? "").trim();
    const mensagem = String(body?.mensagem ?? "").trim();

    const turnosValidos = TURNOS_PROPOSTA.map((t) => t.value);
    if (!profileId || !cargo || !salario || salario === "—" || !turno || !cidade || !mensagem) {
      return NextResponse.json(
        { error: "Preencha cargo, salário (R$), turno, cidade e mensagem." },
        { status: 400 },
      );
    }
    if (!turnosValidos.includes(turno as (typeof turnosValidos)[number])) {
      return NextResponse.json(
        { error: "Selecione um turno válido: Primeiro, Segundo, Terceiro ou Integral." },
        { status: 400 },
      );
    }

    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile || !profile.isVisible || profile.status !== "ACTIVE") {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const unlocked = await prisma.accessRecord.findFirst({
      where: {
        profileId,
        companyUserId: companyUser.id,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });
    if (!unlocked) {
      return NextResponse.json(
        { error: "Libere o contato do profissional antes de enviar proposta." },
        { status: 403 },
      );
    }

    const companyName = companyUser.company?.name || companyUser.name || "Empresa";
    const proposal = await createJobProposal({
      profileId,
      companyUserId: companyUser.id,
      companyName,
      cargo,
      salario,
      turno,
      cidade,
      beneficios,
      mensagem,
    });

    notifyProfessionalAsync(() =>
      notifyProposalReceived({
        profileId,
        companyName,
        cargo,
        salario,
        turno,
        cidade,
      }),
    );

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    console.error("Erro ao criar proposta:", error);
    return NextResponse.json({ error: "Erro ao criar proposta" }, { status: 500 });
  }
}
