import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Em-memory verification codes (reseta a cada deploy)
const VERIFICATION_CODES = new Map<string, { code: string; expiresAt: Date }>()

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o código é válido
    const verification = VERIFICATION_CODES.get(email)
    
    if (!verification || verification.code !== code) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 401 }
      )
    }

    // Verificar se o código expirou
    if (verification.expiresAt < new Date()) {
      VERIFICATION_CODES.delete(email)
      return NextResponse.json(
        { error: 'Código expirado. Solicite um novo.' },
        { status: 401 }
      )
    }

    // Código é válido!
    VERIFICATION_CODES.delete(email)

    // Gerar token de verificação
    const token = crypto
      .randomBytes(32)
      .toString('hex')

    return NextResponse.json({
      token,
      email,
      verified: true
    })
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar email' },
      { status: 500 }
    )
  }
}
