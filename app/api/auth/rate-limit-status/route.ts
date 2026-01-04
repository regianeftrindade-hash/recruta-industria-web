import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Verificar se pode fazer requisição (sem consumir tentativa)
    // Apenas verificamos o status
    const canProceed = checkRateLimit(ip, 5, 15 * 60 * 1000)

    return NextResponse.json({
      ip,
      blocked: !canProceed,
      message: canProceed 
        ? 'Você pode fazer login' 
        : 'Seu IP está bloqueado. Aguarde 15 minutos.',
      retryAfter: !canProceed ? 900 : 0,
      helpText: !canProceed 
        ? 'Consulte /docs/RATE_LIMIT_EXPLAINED.md para mais informações'
        : 'Nenhuma restrição no momento'
    })
  } catch (error: any) {
    console.error('Erro ao verificar rate limit:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}
