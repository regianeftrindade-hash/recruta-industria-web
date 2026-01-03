import { NextRequest, NextResponse } from 'next/server'
import { unblockIP } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ip } = body

    if (!ip) {
      return NextResponse.json(
        { error: 'IP é obrigatório' },
        { status: 400 }
      )
    }

    unblockIP(ip)

    return NextResponse.json({
      success: true,
      message: `IP ${ip} foi desbloqueado`
    })
  } catch (error: any) {
    console.error('Erro ao desbloquear IP:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro ao desbloquear IP' },
      { status: 500 }
    )
  }
}
