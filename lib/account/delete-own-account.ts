import { prisma } from '@/lib/db';
import { resolveCompanyActor, ensureCompanyTeamTable } from '@/lib/company/company-team';

export type DeleteOwnAccountResult = {
  mode: 'professional' | 'company_owner' | 'company_member';
  email: string;
};

/**
 * Remove a conta do próprio usuário autenticado.
 * - Profissional: Profile + Professional + User
 * - Empresa titular: Company (+ cascades) + equipe + User
 * - Membro RH: só o User do membro e vínculos de equipe (empresa permanece)
 */
export async function deleteOwnAccount(userId: string): Promise<DeleteOwnAccountResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: { select: { id: true } },
      company: { select: { id: true, userId: true } },
      professional: { select: { id: true } },
    },
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const actor = await resolveCompanyActor(userId).catch(() => null);

  // Membro de equipe (não titular): remove só a conta do membro
  if (actor && !actor.isOwner) {
    await ensureCompanyTeamTable().catch(() => undefined);
    try {
      await prisma.$executeRaw`
        DELETE FROM "CompanyTeamMember"
        WHERE "memberUserId" = ${userId}
      `;
    } catch (error) {
      console.warn('[delete-account] Falha ao limpar CompanyTeamMember do membro:', error);
    }

    await deleteProfileProfessionalAndUser(user);
    return { mode: 'company_member', email: user.email };
  }

  // Titular de empresa
  if (user.company || (actor?.isOwner && actor.ownerUserId === userId)) {
    await ensureCompanyTeamTable().catch(() => undefined);
    try {
      await prisma.$executeRaw`
        DELETE FROM "CompanyTeamMember"
        WHERE "companyOwnerUserId" = ${userId}
      `;
    } catch (error) {
      console.warn('[delete-account] Falha ao limpar equipe do titular:', error);
    }

    try {
      await prisma.$executeRaw`
        DELETE FROM "CompanyProfileShare"
        WHERE "companyOwnerUserId" = ${userId}
           OR "fromUserId" = ${userId}
           OR "toUserId" = ${userId}
      `;
    } catch {
      // tabela pode não existir em ambientes antigos
    }

    try {
      await prisma.$executeRaw`
        DELETE FROM "CompanyProfileFeedback"
        WHERE "companyOwnerUserId" = ${userId}
           OR "authorUserId" = ${userId}
      `;
    } catch {
      // ignore
    }

    if (user.company) {
      await prisma.company.delete({ where: { id: user.company.id } });
    }

    await deleteProfileProfessionalAndUser(user);
    return { mode: 'company_owner', email: user.email };
  }

  // Profissional (ou conta sem Company)
  await deleteProfileProfessionalAndUser(user);
  return { mode: 'professional', email: user.email };
}

async function deleteProfileProfessionalAndUser(user: {
  id: string;
  profile: { id: string } | null;
  professional: { id: string } | null;
}) {
  if (user.profile) {
    await prisma.profile.delete({ where: { id: user.profile.id } });
  }
  if (user.professional) {
    await prisma.professional.delete({ where: { id: user.professional.id } });
  }
  await prisma.user.delete({ where: { id: user.id } });
}
