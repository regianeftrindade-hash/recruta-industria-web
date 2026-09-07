import { NextResponse } from 'next/server';

/** Endpoint legado — upgrade de plano só via gateway de pagamento. */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint desativado. Use o checkout oficial de pagamento.',
      code: 'UPGRADE_DISABLED',
    },
    { status: 410 },
  );
}
