import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { AI_MONTHLY_LIMITS, resolveAiUser, getUsageSnapshot } from "@/lib/ai";

/** GET /api/ai/usage — quanto resta do limite mensal */
export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: { id: true, email: true, role: true },
    });
    if (!user || (user.role !== "PROFESSIONAL" && user.role !== "COMPANY")) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
    }

    const aiUser = await resolveAiUser({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const usage = await getUsageSnapshot(user.id, aiUser.access.capability);

    return NextResponse.json({
      enabled: aiUser.access.enabled,
      reasonDisabled: aiUser.access.reasonDisabled ?? null,
      audience: aiUser.access.audience,
      capability: aiUser.access.capability,
      mode: aiUser.access.mode,
      planLabel: aiUser.access.planLabel,
      /** Plano real da empresa (Company.planTier) — não usa tabelas Plan/Subscription */
      companyPlanTier: aiUser.access.companyPlanTier,
      premiumAiUnlocked: aiUser.access.premiumAiUnlocked,
      monthlyLimit: AI_MONTHLY_LIMITS[aiUser.access.capability],
      usage,
      limitsTable: {
        professional_basic: AI_MONTHLY_LIMITS.professional_basic,
        company_basic: AI_MONTHLY_LIMITS.company_basic,
        company_premium: AI_MONTHLY_LIMITS.company_premium,
      },
    });
  } catch (error) {
    console.error("[ai/usage]", error);
    return NextResponse.json({ error: "Erro ao consultar uso da IA" }, { status: 500 });
  }
}
