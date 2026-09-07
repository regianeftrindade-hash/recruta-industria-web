import { NextRequest, NextResponse } from 'next/server';
import { confirmCorporateEmailByToken } from '@/lib/company/corporate-email-confirmation';
import { getAppBaseUrl } from '@/lib/company/corporate-email';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim();

  if (!token) {
    return NextResponse.redirect(
      `${getAppBaseUrl()}/company/register?emailErro=${encodeURIComponent('Link de confirmação inválido.')}`,
    );
  }

  const result = await confirmCorporateEmailByToken(token);

  if (!result.ok || !result.email) {
    return NextResponse.redirect(
      `${getAppBaseUrl()}/company/register?emailErro=${encodeURIComponent(result.error || 'Não foi possível confirmar o e-mail.')}`,
    );
  }

  const params = new URLSearchParams({
    emailCorporativo: result.email,
    emailVerificado: '1',
  });

  return NextResponse.redirect(`${getAppBaseUrl()}/company/register?${params.toString()}`);
}
