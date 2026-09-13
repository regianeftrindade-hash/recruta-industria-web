import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { formatCNPJ } from '@/lib/security';
import {
  getAdminExcludedTestAccounts,
  isAdminExcludedTestAccount,
  sqlAndUserIdNotIn,
} from '@/lib/admin/admin-exclude-test-accounts';

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const status = request.nextUrl.searchParams.get('status') || 'PENDING';
    const { userIds: excludedIds } = await getAdminExcludedTestAccounts();
    const excludeCompanyUserSql = sqlAndUserIdNotIn(Prisma.sql`c."userId"`, excludedIds);

    const rows = await prisma.$queryRaw<Array<{
      userId: string;
      name: string;
      cnpj: string | null;
      responsavelNome: string | null;
      emailCorporativo: string | null;
      cartaoCnpjUrl: string | null;
      verificationStatus: string;
      rejectionReason: string | null;
      createdAt: Date;
      email: string;
    }>>`
      SELECT c."userId", c.name, c.cnpj, c."responsavelNome", c."emailCorporativo",
             c."cartaoCnpjUrl", c."verificationStatus", c."rejectionReason", c."createdAt",
             u.email
      FROM "Company" c
      JOIN "User" u ON u.id = c."userId"
      WHERE c."verificationStatus" = ${status}
        ${excludeCompanyUserSql}
      ORDER BY c."createdAt" DESC
      LIMIT 100
    `;

    const companies = rows
      .filter((row) => !isAdminExcludedTestAccount({
        email: row.email,
        companyName: row.name,
      }))
      .map((row) => ({
        userId: row.userId,
        razaoSocial: row.name,
        cnpj: row.cnpj ? formatCNPJ(row.cnpj) : null,
        responsavelNome: row.responsavelNome,
        emailLogin: row.email,
        emailCorporativo: row.emailCorporativo,
        cartaoCnpjUrl: row.cartaoCnpjUrl,
        verificationStatus: row.verificationStatus,
        rejectionReason: row.rejectionReason,
        createdAt: row.createdAt,
      }));

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Erro ao listar empresas para verificação:', error);
    return NextResponse.json({ error: 'Erro ao listar empresas' }, { status: 500 });
  }
}
