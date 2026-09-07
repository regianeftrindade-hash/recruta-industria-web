import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-auth";
import { getNotificationAdminOverview, isWhatsAppEnabled } from "@/lib/notifications";

/**
 * GET /api/admin/notifications — overview para painel futuro.
 * Sem UI no admin (bloqueado); apenas API preparada.
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const overview = await getNotificationAdminOverview();
    return NextResponse.json({
      ok: true,
      whatsappEnabled: isWhatsAppEnabled(),
      overview,
      capabilities: {
        toggleChannel: "via WHATSAPP_ENABLED no servidor",
        viewFailures: true,
        resend: "lib/notifications/admin.adminResendDelivery",
        trackVolume: true,
        trackCosts: "placeholder até Cloud API ativa",
        blockUser: "lib/notifications/admin.adminBlockUserNotifications",
      },
      notice: "Envio real de WhatsApp desativado. Painel visual ainda não ligado.",
    });
  } catch (error) {
    console.error("[admin/notifications]", error);
    return NextResponse.json({ error: "Erro ao carregar overview" }, { status: 500 });
  }
}
