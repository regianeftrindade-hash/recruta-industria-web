import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType, email, amount, paymentMethod, cardData } = body;

    // Validações básicas
    if (!email || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Rotear para a integração correta do PagSeguro
    let paymentResponse;

    if (paymentMethod === 'credit') {
      // Usar API de pagamento com cartão
      paymentResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/pagseguro/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Upgrade para Plano Premium`,
          amount: Math.round(amount * 100), // Converter para centavos
          email: email,
          paymentMethod: 'credit_card',
          card: cardData
        })
      });
    } else if (paymentMethod === 'pix') {
      // Usar API PIX do PagSeguro
      paymentResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/pagseguro/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Upgrade para Plano Premium`,
          amount: Math.round(amount * 100),
          email: email
        })
      });
    } else if (paymentMethod === 'boleto') {
      // Usar API de boleto do PagSeguro
      paymentResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/pagseguro/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Upgrade para Plano Premium`,
          amount: Math.round(amount * 100),
          email: email,
          paymentMethod: 'boleto'
        })
      });
    }

    if (!paymentResponse || !paymentResponse.ok) {
      const errorData = await paymentResponse?.json();
      console.error('Payment Error:', errorData);
      return NextResponse.json(
        { error: 'Erro ao processar pagamento' },
        { status: paymentResponse?.status || 500 }
      );
    }

    const paymentData = await paymentResponse.json();

    // Retornar dados de sucesso
    return NextResponse.json({
      success: true,
      ...paymentData,
      message: 'Pagamento processado com sucesso'
    });

  } catch (error) {
    console.error('Payment API Error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}
