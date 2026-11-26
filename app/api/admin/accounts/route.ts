import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminEmails, requireAdmin } from '@/lib/auth/admin-auth';
import { getAdminExcludedTestAccounts } from '@/lib/admin/admin-exclude-test-accounts';

const MAX_LIMIT = 50;
const MIN_QUERY = 2;

/**
 * Busca operacional de contas (profissional/empresa) por e-mail, nome ou empresa.
 * Não lista o banco inteiro — exige termo e limita o resultado.
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    const roleRaw = (request.nextUrl.searchParams.get('role') || 'ALL').toUpperCase();
    const role =
      roleRaw === 'PROFESSIONAL' || roleRaw === 'COMPANY' ? roleRaw : 'ALL';
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(request.nextUrl.searchParams.get('limit') || 30) || 30),
    );

    if (q.length < MIN_QUERY) {
      return NextResponse.json({
        accounts: [],
        query: q,
        hint: `Informe ao menos ${MIN_QUERY} caracteres.`,
      });
    }

    const adminEmails = new Set(getAdminEmails().map((e) => e.toLowerCase()));
    const { userIds: excludedIds } = await getAdminExcludedTestAccounts();

    const users = await prisma.user.findMany({
      where: {
        AND: [
          role === 'ALL' ? {} : { role },
          excludedIds.length ? { id: { notIn: excludedIds } } : {},
          {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { company: { name: { contains: q, mode: 'insensitive' } } },
              { profile: { title: { contains: q, mode: 'insensitive' } } },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        profile: { select: { title: true, status: true, isVisible: true } },
        company: {
          select: {
            name: true,
            verificationStatus: true,
            planTier: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const accounts = users.map((u) => {
      const email = u.email.toLowerCase().trim();
      const isAdmin = u.role === 'ADMIN' || adminEmails.has(email);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: isAdmin ? 'ADMIN' : u.role,
        isAdmin,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        profile: u.profile,
        company: u.company,
      };
    });

    return NextResponse.json({
      accounts,
      query: q,
      role,
      total: accounts.length,
    });
  } catch (error) {
    console.error('Erro ao buscar contas admin:', error);
    return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 });
  }
}
