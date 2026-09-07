import { prisma } from '@/lib/db';
import { matchesCompanyTestBypass } from '@/lib/company/company-test-bypass-shared';

export { matchesCompanyTestBypass } from '@/lib/company/company-test-bypass-shared';

/**
 * Conta de teste empresarial: libera dashboard sem cadastro obrigatório.
 * Garante role COMPANY + registro Company mínimo.
 */
export async function ensureCompanyTestBypassReady(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) return false;

    const isBypass = matchesCompanyTestBypass({
      email: user.email,
      companyName: user.company?.name,
      userName: user.name,
    });

    if (!isBypass) return false;

    if (user.role !== 'COMPANY') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'COMPANY' },
      });
    }

    if (!user.company) {
      const fallbackName =
        user.name?.trim()
        || user.email.split('@')[0]
        || 'Empresa Teste';

      await prisma.company.create({
        data: {
          userId,
          name: fallbackName,
        },
      });
    }

    // Garante plano EMPRESARIAL no banco (além do bypass em memória)
    try {
      await prisma.$executeRaw`
        UPDATE "Company"
        SET "planTier" = 'EMPRESARIAL',
            "subscriptionExpiresAt" = NULL,
            "updatedAt" = NOW()
        WHERE "userId" = ${userId}
          AND ("planTier" IS NULL OR "planTier" <> 'EMPRESARIAL')
      `;
    } catch {
      /* ignore — bypass em memória ainda libera */
    }

    return true;
  } catch (err) {
    console.error('ensureCompanyTestBypassReady falhou:', err);
    // Se o e-mail bate, ainda consideramos bypass (libera painel)
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && matchesCompanyTestBypass({ email: user.email, userName: user.name })) {
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }
}

export async function isCompanyTestBypassUserId(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) return false;

    return matchesCompanyTestBypass({
      email: user.email,
      companyName: user.company?.name,
      userName: user.name,
    });
  } catch {
    return false;
  }
}
