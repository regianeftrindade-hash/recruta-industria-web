import { bindLocale } from '@/lib/i18n/active-locale'
import { resolveInterfaceLocale } from '@/lib/i18n/resolve-interface-locale'
import { t } from '@/lib/i18n/translate'
import { NextRequest, NextResponse } from 'next/server'
import { registrationDocumentError } from '@/lib/identity/registration-documents'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    bindLocale(await resolveInterfaceLocale())
    const body = await request.json()
    const { cpf } = body

    if (!cpf) {
      return NextResponse.json(
        { error: t("registration.ui.cpf-obrigatorio") },
        { status: 400 }
      )
    }

    const cpfLimpo = cpf.replace(/\D/g, '')

    // Validar formato do CPF
    const cpfErro = registrationDocumentError(cpfLimpo, 'CPF', 'BR', t("registration.ui.cpf-formato-incorreto"))
    if (cpfErro) {
      return NextResponse.json(
        { 
          valid: false,
          message: cpfErro,
          exists: false
        },
        { status: 200 }
      )
    }

    // CPF é válido
    return NextResponse.json(
      { 
        valid: true,
        message: t("registration.ui.cpf-valido-simples"),
        exists: false
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao validar CPF:', error)
    return NextResponse.json(
      { 
        valid: false,
        message: t("registration.ui.erro-ao-validar-cpf"),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
