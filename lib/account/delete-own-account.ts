import { prisma } from '@/lib/db';
import { resolveCompanyActor, ensureCompanyTeamTable } from '@/lib/company/company-team';
import {
  collectStoragePathsFromUnknown,
  professionalVideoFolderPrefix,
  removePrivateFiles,
  removePrivateFilesByPrefixes,
  uploadOwnerFolderPrefixes,
} from '@/lib/storage/private-uploads';

export type DeleteOwnAccountResult = {
  mode: 'professional' | 'company_owner' | 'company_member';
  email: string;
  /** Observações técnicas (sem PII) para auditoria/testes. */
  storageNotes?: string[];
};

/**
 * Remove a conta do próprio usuário autenticado.
 * - Profissional: Profile + Professional + User
 * - Empresa titular: Company (+ cascades) + equipe + User
 * - Membro RH: só o User do membro e vínculos de equipe (empresa permanece)
 *
 * Storage: best-effort (campos conhecidos + formDataJSON + pastas por e-mail/vídeo).
 * PaymentRecord e logs de auditoria NÃO são apagados automaticamente
 * (podem haver obrigações legais — decisão empresarial/jurídica).
 */
export async function deleteOwnAccount(userId: string): Promise<DeleteOwnAccountResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          id: true,
          avatar: true,
          curricoURL: true,
          atestadoURL: true,
          videoApresentacaoPath: true,
          formDataJSON: true,
        },
      },
      company: {
        select: {
          id: true,
          userId: true,
          logoUrl: true,
          fotoResponsavelUrl: true,
          cartaoCnpjUrl: true,
        },
      },
      professional: { select: { id: true } },
    },
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const storageNotes: string[] = [];
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

    await deleteProfileProfessionalAndUser(user, storageNotes);
    return { mode: 'company_member', email: user.email, storageNotes };
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
      await bestEffortRemoveStorage(
        [
          user.company.logoUrl,
          user.company.fotoResponsavelUrl,
          user.company.cartaoCnpjUrl,
        ],
        storageNotes,
      );
      await bestEffortRemovePrefixes(
        uploadOwnerFolderPrefixes(user.email),
        storageNotes,
      );
      await prisma.company.delete({ where: { id: user.company.id } });
    }

    await deleteProfileProfessionalAndUser(user, storageNotes);
    return { mode: 'company_owner', email: user.email, storageNotes };
  }

  // Profissional (ou conta sem Company)
  await deleteProfileProfessionalAndUser(user, storageNotes);
  return { mode: 'professional', email: user.email, storageNotes };
}

async function bestEffortRemoveStorage(
  paths: Array<string | null | undefined>,
  notes: string[],
) {
  try {
    const list = paths.filter((p): p is string => Boolean(p && String(p).trim()));
    if (list.length === 0) return;
    const result = await removePrivateFiles(list);
    if (result.removed.length) notes.push(`removed_files:${result.removed.length}`);
    if (result.failed.length) notes.push(`failed_files:${result.failed.length}`);
  } catch (error) {
    console.warn('[delete-account] Falha ao limpar arquivos do storage:', error);
    notes.push('storage_remove_error');
  }
}

async function bestEffortRemovePrefixes(prefixes: string[], notes: string[]) {
  try {
    if (prefixes.length === 0) return;
    const result = await removePrivateFilesByPrefixes(prefixes);
    if (result.removed.length) notes.push(`removed_prefix_files:${result.removed.length}`);
    if (result.failed.length) notes.push(`failed_prefix:${result.failed.length}`);
  } catch (error) {
    console.warn('[delete-account] Falha ao limpar pastas do storage:', error);
    notes.push('prefix_remove_error');
  }
}

async function deleteProfileProfessionalAndUser(
  user: {
    id: string;
    email: string;
    profile: {
      id: string;
      avatar?: string | null;
      curricoURL?: string | null;
      atestadoURL?: string | null;
      videoApresentacaoPath?: string | null;
      formDataJSON?: string | null;
    } | null;
    professional: { id: string } | null;
  },
  notes: string[],
) {
  if (user.profile) {
    const fromJson = collectStoragePathsFromUnknown(user.profile.formDataJSON);
    await bestEffortRemoveStorage(
      [
        user.profile.avatar,
        user.profile.curricoURL,
        user.profile.atestadoURL,
        user.profile.videoApresentacaoPath,
        ...fromJson,
      ],
      notes,
    );
    if (fromJson.length) notes.push(`formdata_paths:${fromJson.length}`);
  }

  await bestEffortRemovePrefixes(uploadOwnerFolderPrefixes(user.email), notes);
  const videoPrefix = professionalVideoFolderPrefix(user.id);
  if (videoPrefix) {
    await bestEffortRemovePrefixes([videoPrefix], notes);
  }

  if (user.profile) {
    await prisma.profile.delete({ where: { id: user.profile.id } });
  }
  if (user.professional) {
    await prisma.professional.delete({ where: { id: user.professional.id } });
  }
  await prisma.user.delete({ where: { id: user.id } });
  notes.push('payment_records_retained');
}
