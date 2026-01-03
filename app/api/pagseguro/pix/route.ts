import { NextResponse } from "next/server"

const PAGSEGURO_ORDERS_URL = "https://sandbox.api.pagseguro.com/orders"

export async function POST(request: Request) {
  try {
    const token = process.env.PAGSEGURO_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: "PAGSEGURO_TOKEN not configured" },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const name = (body?.name as string) || "Cliente"
    const email = (body?.email as string) || "cliente@example.com"
    const amount = Number(body?.amount) || 2990 // cents

    const payload = {
      reference_id: `order-${Date.now()}`,
      customer: {
        name,
        email,
      },
      notification_urls: process.env.PAGSEGURO_NOTIFICATION_URL
        ? [process.env.PAGSEGURO_NOTIFICATION_URL]
        : undefined,
      items: [
        {
          reference_id: "premium-plan",
          name: "Assinatura Premium",
          quantity: 1,
          unit_amount: amount,
        },
      ],
      charges: [
        {
          reference_id: `charge-${Date.now()}`,
          description: "Assinatura Premium",
          amount: {
            value: amount,
            currency: "BRL",
          },
          payment_method: {
            type: "PIX",
          },
        },
      ],
    }

    const response = await fetch(PAGSEGURO_ORDERS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: "PagSeguro error", detail: errorText },
        { status: 502 }
      )
    }

    const data = (await response.json()) as any
    const charge = data?.charges?.[0]
    const qr = charge?.payment_method?.qr_codes?.[0]

    if (!qr?.text || !charge?.id) {
      return NextResponse.json(
        { error: "Invalid PagSeguro response" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      chargeId: charge.id,
      copyPasteKey: qr.text,
      expiresAt: qr.expires_at,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Unexpected error", detail: error?.message },
      { status: 500 }
    )
  }
}
