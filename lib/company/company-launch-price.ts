import type { BillingMode, BillingPeriod } from "@/lib/billing";
import { getPlanPriceCentavos } from "@/lib/billing";
import type { CompanyPlanDefinition } from "@/lib/company/company-premium-plans";
import { asCompanyPaymentMeta } from "@/lib/payment-config";

/** Meses em que o preço de lançamento substitui o preço normal, só no mensal. */
export const COMPANY_LAUNCH_MONTHS = 3;

export function companyLaunchApplies(input: {
  period: BillingPeriod;
  mode?: BillingMode;
  paidLaunchMonths: number;
  launchCentavos?: number;
}): boolean {
  if (input.period !== "monthly") return false;
  if (input.mode === "recurring") return false;
  if (!input.launchCentavos || input.launchCentavos <= 0) return false;
  return input.paidLaunchMonths < COMPANY_LAUNCH_MONTHS;
}

/** Valor mensal base (em centavos) antes do cálculo anual. */
export function companyChargeBaseCentavos(
  plan: Pick<CompanyPlanDefinition, "precoCentavos" | "precoLancamentoCentavos">,
  period: BillingPeriod,
  paidLaunchMonths: number,
  mode?: BillingMode,
): number {
  if (
    companyLaunchApplies({
      period,
      mode,
      paidLaunchMonths,
      launchCentavos: plan.precoLancamentoCentavos,
    })
  ) {
    return plan.precoLancamentoCentavos as number;
  }
  return plan.precoCentavos;
}

export function companyChargeCentavos(
  plan: Pick<CompanyPlanDefinition, "precoCentavos" | "precoLancamentoCentavos">,
  period: BillingPeriod,
  paidLaunchMonths: number,
  mode?: BillingMode,
): number {
  return getPlanPriceCentavos(
    companyChargeBaseCentavos(plan, period, paidLaunchMonths, mode),
    period,
  );
}

/** Valores que uma cobrança já paga deste plano pode ter. O anual não usa lançamento. */
export function acceptedCompanyPaymentCentavos(
  plan: Pick<CompanyPlanDefinition, "precoCentavos" | "precoLancamentoCentavos">,
  period: BillingPeriod,
): number[] {
  const full = getPlanPriceCentavos(plan.precoCentavos, period);
  if (period === "monthly" && plan.precoLancamentoCentavos && plan.precoLancamentoCentavos !== plan.precoCentavos) {
    return [full, plan.precoLancamentoCentavos];
  }
  return [full];
}

export function launchMonthsFromPayments(
  rows: Array<{ status: string; meta: string | null }>,
  companyUserId: string,
): number {
  let months = 0;
  for (const row of rows) {
    if (row.status !== "PAID") continue;
    const meta = asCompanyPaymentMeta(row.meta);
    if (!meta || meta.companyUserId !== companyUserId) continue;
    const period = meta.billingPeriod === "annual" ? "annual" : "monthly";
    months += period === "annual" ? COMPANY_LAUNCH_MONTHS : 1;
  }
  return months;
}
