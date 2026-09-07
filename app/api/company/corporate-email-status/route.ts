import { NextRequest, NextResponse } from 'next/server';
import { corporateEmailError, normalizeCorporateEmail } from '@/lib/company/corporate-email';
import { isCorporateEmailVerified } from '@/lib/company/corporate-email-confirmation';

export async function GET(req: NextRequest) {
  try {
    const rawEmail = req.nextUrl.searchParams.get('email');

    if (!rawEmail) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const email = normalizeCorporateEmail(rawEmail);
    const validationError = corporateEmailError(email);
    if (validationError) {
      return NextResponse.json({ verified: false, error: validationError }, { status: 200 });
    }

    const verified = await isCorporateEmailVerified(email);

    return NextResponse.json({ verified, email });
  } catch (error) {
    console.error('Erro ao consultar status do e-mail corporativo:', error);
    return NextResponse.json({ error: 'Erro ao consultar confirmação.' }, { status: 500 });
  }
}
