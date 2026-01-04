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

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    const verifications = await getVerifications()
    const verification = verifications.find(
      (v: any) => v.email === email && v.code === code && !v.verified
    )

    if (!verification) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 401 }
      )
    }

    // Verificar se o código expirou (válido por 15 minutos)
    const createdTime = new Date(verification.createdAt).getTime()
    const now = Date.now()
    const fifteenMinutes = 15 * 60 * 1000

    if (now - createdTime > fifteenMinutes) {
      verification.verified = false
      await saveVerifications(verifications)
      return NextResponse.json(
        { error: 'Código expirado. Solicite um novo.' },
        { status: 401 }
      )
    }

    // Marcar como verificado
    verification.verified = true
    verification.verifiedAt = new Date().toISOString()
    await saveVerifications(verifications)

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
