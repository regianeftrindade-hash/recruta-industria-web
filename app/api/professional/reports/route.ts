import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import { getProfessionalPlanContext } from '@/lib/professional-plan';
import { buildProfessionalActivityReport } from '@/lib/professional-reports';
import { ensurePaymentSchema } from '@/lib/ensure-db-schema';

export async function GET(request: NextRequest) {
  try {
    await ensurePaymentSchema();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user || user.role !== 'PROFESSIONAL' || !user.profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 403 });
    }

    const planContext = await getProfessionalPlanContext(user.id);

    if (!planContext.features.canAccessDetailedReports) {
      return NextResponse.json(
        {
          error: 'Relatórios detalhados disponíveis no plano Premium.',
          upgradeRequired: 'PREMIUM',
        },
        { status: 403 },
      );
    }

    const periodParam = new URL(request.url).searchParams.get('period');
    const period = periodParam === '7d' || periodParam === 'all' ? periodParam : '30d';

    const report = await buildProfessionalActivityReport(user.profile.id, period);

    return NextResponse.json({ report, plan: planContext });
  } catch (error) {
    console.error('Erro ao gerar relatório profissional:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 });
  }
}
