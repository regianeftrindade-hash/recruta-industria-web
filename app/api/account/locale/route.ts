import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";
import { LOCALE_COOKIE, localeCookieOptions } from "@/lib/i18n/locale-cookie";
import { parseLocalePreference } from "@/lib/i18n/locale-preference";

export async function POST(request: NextRequest) {
  const currentLocale = await resolveInterfaceLocale();
  const body = await request.json().catch(() => null);
  const parsed = parseLocalePreference(body);
  if (!parsed.ok) {
    const message = parsed.error === "region"
      ? t("locale.unchangedRegion", currentLocale)
      : t("locale.invalid", currentLocale);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { locale: parsed.locale },
    });
  }

  const response = NextResponse.json({
    ok: true,
    locale: parsed.locale,
    message: t("locale.saved", parsed.locale),
  });
  response.cookies.set(LOCALE_COOKIE, parsed.locale, localeCookieOptions());
  return response;
}
