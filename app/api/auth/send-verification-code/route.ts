import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { join } from 'path'
import crypto from 'crypto'

const DATA_DIR = join(process.cwd(), 'data')
const VERIFICATION_FILE = join(DATA_DIR, 'email_verifications.json')

async function ensureFile() {
  try {
    await fs.promises.access(VERIFICATION_FILE)
  } catch {
    await fs.promises.mkdir(DATA_DIR, { recursive: true })
    await fs.promises.writeFile(VERIFICATION_FILE, '[]')
  }
}

async function getVerifications() {
  await ensureFile()
  const txt = await fs.promises.readFile(VERIFICATION_FILE, 'utf8')
  return JSON.parse(txt || '[]')
}

async function saveVerifications(data: any[]) {
  await fs.promises.writeFile(VERIFICATION_FILE, JSON.stringify(data, null, 2))
}

// Em produção, usar um serviço de email real como SendGrid, Mailgun, etc
async function sendVerificationEmail(email: string, code: string) {
  console.log(`📧 [DEV] Código de verificação para ${email}: ${code}`)
  
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

    const verifications = await getVerifications()

    // Verificar se já existe um código ativo para este email
    const activeCode = verifications.find(
      (v: any) =>
        v.email === email &&
        !v.verified &&
        new Date(v.createdAt).getTime() > Date.now() - 60000 // Menos de 1 minuto
    )

    if (activeCode) {
      return NextResponse.json(
        { error: 'Aguarde antes de solicitar um novo código' },
        { status: 429 }
      )
    }

    // Gerar código de 6 dígitos
    const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')

    // Salvar verificação
    verifications.push({
      id: `verify-${Date.now()}`,
      email,
      code,
      verified: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    })

    await saveVerifications(verifications)

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
