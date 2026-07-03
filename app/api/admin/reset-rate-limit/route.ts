import { NextRequest, NextResponse } from 'next/server'
import { resetRateLimit } from '@/lib/security'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const body = await request.json()
    const { identifier } = body

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier (email ou IP) é obrigatório' },
        { status: 400 }
      )
    }

    resetRateLimit(identifier)

    return NextResponse.json({
      success: true,
      message: `Rate limit foi resetado para: ${identifier}`
    })
  } catch (error: any) {
    console.error('Erro ao resetar rate limit:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro ao resetar rate limit' },
      { status: 500 }
    )
  }
}
