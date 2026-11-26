import { prisma } from "@/lib/db";
import {
  getCompanyExtraData,
  loadCompanyRowByUserId,
} from "@/lib/company-storage";
import { getCompanyPlanContext } from "@/lib/company-plan";
import { companyCanSearchProfessionals } from "@/lib/company/company-search-access";
import { isCompanyTestBypassUserId } from "@/lib/company/company-test-bypass";
import { COMPANY_VIEW_ONLY_NOTICE } from "@/lib/company/company-verification";

type CompanyPlanContext = Awaited<ReturnType<typeof getCompanyPlanContext>>;

export type CompanyCandidateAccessOk = {
  ok: true;
  planContext: CompanyPlanContext;
  dataUserId: string;
};

export type CompanyCandidateAccessDenied = {
  ok: false;
  status: 403;
  body: {
    error: string;
    requiresRegistration?: boolean;
    requiresVerification?: boolean;
  };
};

/**
 * Cadastro completo + verificação obrigatórios para acessar dados de candidatos
 * (listagem, detalhe, unlock, tracking e mídia desbloqueada).
 */
export async function assertCompanyCandidateAccess(
  companyUserId: string,
  options?: { actorUserId?: string | null },
): Promise<CompanyCandidateAccessOk | CompanyCandidateAccessDenied> {
  const planContext = await getCompanyPlanContext(companyUserId);
  const dataUserId = planContext.ownerUserId || companyUserId;
  const actorUserId = options?.actorUserId || companyUserId;

  const companyRow = await loadCompanyRowByUserId(dataUserId);
  const extra = await getCompanyExtraData(dataUserId);
  const bypass =
    (await isCompanyTestBypassUserId(dataUserId)) ||
    (dataUserId !== actorUserId && (await isCompanyTestBypassUserId(actorUserId)));

  const registrationComplete = companyCanSearchProfessionals(
    {
      name: companyRow?.name,
      cnpj: extra.cnpj,
      responsavelNome: extra.responsavelNome,
      responsavelCpf: extra.responsavelCpf,
      telefone: extra.telefone,
      endereco: extra.endereco,
    },
    bypass,
  );

  if (!registrationComplete) {
    return {
      ok: false,
      status: 403,
      body: {
        error: "Complete o cadastro da empresa para visualizar profissionais.",
        requiresRegistration: true,
      },
    };
  }

  if (!planContext.verification.canAccessSensitiveProfiles) {
    return {
      ok: false,
      status: 403,
      body: {
        error: COMPANY_VIEW_ONLY_NOTICE,
        requiresVerification: true,
      },
    };
  }

  return { ok: true, planContext, dataUserId };
}

/** Unlock ativo do titular do plano sobre o perfil. */
export async function companyHasActiveUnlock(
  ownerUserId: string,
  profileId: string,
): Promise<boolean> {
  const unlocked = await prisma.accessRecord.findFirst({
    where: {
      profileId,
      companyUserId: ownerUserId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  return Boolean(unlocked);
}
