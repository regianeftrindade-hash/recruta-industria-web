import { NextResponse } from 'next/server';

/** Rota legada — use /api/company/payments/create ou /api/professional/payments/create */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint descontinuado',
      detail: 'Faça login e use o checkout em /company/pagamento ou /professional/pagamento',
    },
    { status: 410 },
  );
}
