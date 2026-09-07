import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  COMPANY_EXTRA_SEAT,
  COMPANY_EXTRA_SEAT_PACKAGES,
  calcExtraSeatsAmountCentavos,
  getCompanyExtraSeats,
  getEffectiveMaxUsers,
  getExtraSeatPackage,
} from "@/lib/company/company-extra-seats";
import { resolveCompanyActor } from "@/lib/company/company-team";
import { getCompanyExtraData } from "@/lib/company-storage";
import { buildCompanyExtraSeatDescription } from "@/lib/company-payment";
import {
  createGatewayPayment,
  getGatewayApiUrl,
  type GatewayPaymentMethod,
} from "@/lib/payment/gateway";
import { isPaymentGatewayConfigured, isSandboxMode, getPaymentProvider } from "@/lib/payment-config";
import { sanitizeTaxId, fallbackTaxIdForSandbox } from "@/lib/payment-tax";

async function getCompanyUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  return prisma.user.findUnique({
    where: { email: auth.email },
    include: { company: true },
  });
}

/** Lista pacotes de usuários extras. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const actor = await resolveCompanyActor(user.id);
    if (!actor) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const seats = await getEffectiveMaxUsers(actor.ownerUserId);
    return NextResponse.json({
      packages: COMPANY_EXTRA_SEAT_PACKAGES.map((p) => ({
        id: p.id,
        quantity: p.quantity,
        priceCentavos: p.priceCentavos,
        priceLabel: p.priceLabel,
        title: p.title,
        emoji: p.emoji,
        period: "/mês",
      })),
      ...seats,
    });
  } catch (error) {
    console.error("Erro ao listar pacotes de assentos:", error);
    return NextResponse.json({ error: "Erro ao listar pacotes" }, { status: 500 });
  }
}

/** Cria cobrança de pacote de usuário(s) RH extra(s). */
export async function POST(request: NextRequest) {
  try {
    if (!isPaymentGatewayConfigured()) {
      return NextResponse.json(
        {
          error: "Gateway de pagamento não configurado",
          detail: getPaymentProvider() === "asaas"
            ? "Defina ASAAS_API_KEY no .env.local"
            : "Defina PAGSEGURO_TOKEN no .env.local",
        },
        { status: 503 },
      );
    }

    const user = await getCompanyUser(request);
    if (!user || user.role !== "COMPANY" || !user.company) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const actor = await resolveCompanyActor(user.id);
    if (!actor?.isOwner) {
      return NextResponse.json(
        { error: "Somente o administrador principal pode comprar usuários extras." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const pack =
      getExtraSeatPackage(String(body?.packageId || "").trim()) ||
      getExtraSeatPackage(Number(body?.quantity) || 0);
    if (!pack) {
      return NextResponse.json(
        { error: "Escolha um pacote válido: 1, 3 ou 5 usuários extras." },
        { status: 400 },
      );
    }

    const quantity = pack.quantity;
    const method = (body?.method || "pix") as GatewayPaymentMethod;

    if (!["pix", "boleto"].includes(method)) {
      return NextResponse.json({ error: "Use Pix ou Boleto." }, { status: 400 });
    }

    const currentExtra = await getCompanyExtraSeats(actor.ownerUserId);
    if (currentExtra + quantity > COMPANY_EXTRA_SEAT.maxPurchasable) {
      return NextResponse.json(
        {
          error: `Limite de usuários extras atingido (máx. ${COMPANY_EXTRA_SEAT.maxPurchasable}).`,
        },
        { status: 400 },
      );
    }

    const seats = await getEffectiveMaxUsers(actor.ownerUserId);
    if (seats.includedSeats <= 0 || seats.planTier === "FREE") {
      return NextResponse.json(
        { error: "Contrate um plano pago antes de adicionar usuários extras." },
        { status: 403 },
      );
    }

    let amount: number;
    try {
      amount = calcExtraSeatsAmountCentavos(quantity);
    } catch {
      return NextResponse.json({ error: "Pacote inválido." }, { status: 400 });
    }

    const name = String(user.company.name || user.name || "Empresa").trim();
    const email = user.email.toLowerCase().trim();
    const extra = await getCompanyExtraData(actor.ownerUserId);
    const taxId =
      sanitizeTaxId(extra.cnpj) ?? (isSandboxMode() ? fallbackTaxIdForSandbox() : undefined);

    if (!taxId) {
      return NextResponse.json(
        { error: "Cadastre o CNPJ da empresa antes de pagar." },
        { status: 400 },
      );
    }

    const description = buildCompanyExtraSeatDescription(quantity);
    const payment = await createGatewayPayment({
      amount,
      method,
      customer: { name, email, taxId },
      description,
      itemReference: `company-extra-seat-x${quantity}`,
    });

    const meta = {
      type: "company_extra_seats",
      companyUserId: actor.ownerUserId,
      quantity,
      packageId: pack.id,
      expectedAmount: amount,
    };

    await prisma.paymentRecord.create({
      data: {
        reference: payment.chargeId,
        amount,
        currency: "BRL",
        method,
        customer: JSON.stringify({ name, email }),
        status: payment.status,
        meta: JSON.stringify(meta),
        externalId: payment.orderId,
      },
    });

    const apiUrl = getGatewayApiUrl();

    return NextResponse.json({
      chargeId: payment.chargeId,
      copyPasteKey: payment.copyPasteKey,
      qrCodeDataUrl: payment.qrCodeDataUrl,
      boletoUrl: payment.boletoUrl,
      checkoutUrl: payment.checkoutUrl,
      expiresAt: payment.expiresAt,
      status: payment.status,
      quantity,
      packageId: pack.id,
      amount,
      unitPriceCentavos: COMPANY_EXTRA_SEAT.priceCentavos,
      priceLabel: pack.priceLabel,
      provider: payment.provider,
      sandbox: apiUrl.includes("sandbox"),
    });
  } catch (error) {
    console.error("Erro ao cobrar usuário extra:", error);
    const message = error instanceof Error ? error.message : "Erro inesperado";
    const status = message.includes("não configurado") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
