import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

async function getVerifications() {
  try {
    const verifications = await prisma.emailVerification.findMany()
    return verifications
  } catch {
    return []
  }
}

async function saveVerification(email: string, code: string) {
  try {
    // Remover código antigo se existir
    await prisma.emailVerification.deleteMany({
      where: { email }
    })
    
    // Criar novo código com expiração de 10 minutos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await prisma.emailVerification.create({
      data: {
        email,
        code,
        expiresAt
      }
    })
    return true
  } catch (error) {
    console.error('Erro ao salvar verificação:', error)
    return false
  }
}

// Em produção, usar um serviço de email real como SendGrid, Mailgun, etc
async function sendVerificationEmail(email: string, code: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] Código de verificação para ${email}: ${code}`)
  }
  
  // TODO: Implementar envio real de email
  // Aqui você integraria com SendGrid, Mailgun, ou AWS SES
  return true
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Verificar se já existe um código ativo para este email
    const activeCode = await prisma.emailVerification.findFirst({
      where: { email }
    })

    if (activeCode && activeCode.expiresAt > new Date()) {
      return NextResponse.json(
        { error: 'Aguarde antes de solicitar um novo código' },
        { status: 429 }
      )
    }

    // Gerar código de 6 dígitos
    const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')

    // Salvar verificação
    await saveVerification(email, code)

    // Enviar email
    await sendVerificationEmail(email, code)

    return NextResponse.json({
      success: true,
      message: 'Código de verificação enviado',
      email
    })
  } catch (error) {
    console.error('Error sending verification code:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar código' },
      { status: 500 }
    )
  }
}
