import { NextRequest, NextResponse } from 'next/server'
import { isValidCPF } from '@/lib/security'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf } = body

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    const cpfLimpo = cpf.replace(/\D/g, '')

    // Validar formato do CPF
    if (!isValidCPF(cpfLimpo)) {
      return NextResponse.json(
        { 
          valid: false,
          message: 'CPF inválido - formato incorreto',
          exists: false
        },
        { status: 200 }
      )
    }

    // CPF é válido
    return NextResponse.json(
      { 
        valid: true,
        message: 'CPF válido',
        exists: false
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao validar CPF:', error)
    return NextResponse.json(
      { 
        valid: false,
        message: 'Erro ao validar CPF',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
