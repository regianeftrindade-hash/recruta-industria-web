import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { formatCNPJ } from '@/lib/security';

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const status = request.nextUrl.searchParams.get('status') || 'PENDING';
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
      ORDER BY c."createdAt" DESC
      LIMIT 100
    `;

    return NextResponse.json({
      companies: rows.map((row) => ({
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
      })),
    });
  } catch (error) {
    console.error('Erro ao listar empresas para verificação:', error);
    return NextResponse.json({ error: 'Erro ao listar empresas' }, { status: 500 });
  }
}
