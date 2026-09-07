import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "@/lib/notifications";

async function requireUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  return prisma.user.findUnique({
    where: { email: auth.email },
    select: { id: true, email: true, role: true },
  });
}

/** GET — preferências de notificação do usuário autenticado */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const prefs = await getUserNotificationPreferences(user.id);
    return NextResponse.json({
      ok: true,
      preferences: prefs,
      notice:
        "WhatsApp só envia com consentimento explícito + telefone verificado + opt-in. Número cadastrado sozinho não autoriza.",
    });
  } catch (error) {
    console.error("[notifications/preferences GET]", error);
    return NextResponse.json({ error: "Erro ao carregar preferências" }, { status: 500 });
  }
}

/**
 * PATCH — atualiza preferências.
 * Body: { inAppEnabled?, emailEnabled?, whatsappEnabled?, whatsappConsent?, phoneVerified? }
 * phoneVerified normalmente seria setado por fluxo de OTP futuro (admin/sistema).
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const patch: Parameters<typeof updateUserNotificationPreferences>[1] = {};

    if (typeof body.inAppEnabled === "boolean") patch.inAppEnabled = body.inAppEnabled;
    if (typeof body.emailEnabled === "boolean") patch.emailEnabled = body.emailEnabled;
    if (typeof body.whatsappEnabled === "boolean") patch.whatsappEnabled = body.whatsappEnabled;
    if (typeof body.whatsappConsent === "boolean") patch.whatsappConsent = body.whatsappConsent;
    // phoneVerified: não confiar no client em produção futura; aqui só permite false pelo usuário
    if (body.phoneVerified === false) patch.phoneVerified = false;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    }

    if (patch.whatsappEnabled === true) {
      const current = await getUserNotificationPreferences(user.id);
      const willHaveConsent =
        patch.whatsappConsent === true || current.whatsappConsent === true;
      if (!willHaveConsent) {
        return NextResponse.json(
          {
            error:
              "Para ativar WhatsApp, envie também whatsappConsent: true (consentimento explícito).",
            code: "NO_CONSENT",
          },
          { status: 400 },
        );
      }
    }

    const preferences = await updateUserNotificationPreferences(user.id, patch);
    return NextResponse.json({ ok: true, preferences });
  } catch (error) {
    console.error("[notifications/preferences PATCH]", error);
    return NextResponse.json({ error: "Erro ao salvar preferências" }, { status: 500 });
  }
}
