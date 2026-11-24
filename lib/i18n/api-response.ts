import { NextResponse } from "next/server";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import type { SupportedLocale } from "@/lib/i18n/locales";

/** Resposta 401 com mensagem no idioma da requisição (cookie/sessão/Accept-Language). */
export async function apiUnauthorizedResponse(): Promise<NextResponse> {
  const locale = await resolveInterfaceLocale();
  return NextResponse.json(
    { error: t("rest.api.unauthenticated", locale) },
    { status: 401 },
  );
}

/** Erro JSON localizado sem alterar status HTTP padrão da rota. */
export async function apiErrorResponse(
  key: MessageKey,
  status: number,
  locale?: SupportedLocale | null,
): Promise<NextResponse> {
  const resolved = locale ?? (await resolveInterfaceLocale());
  return NextResponse.json({ error: t(key, resolved) }, { status });
}
