import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const DEV_FALLBACK_KEY = 'dev-key-12345'

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminUser(email: string, role?: string | null): boolean {
  if (role === 'ADMIN') return true
  return getAdminEmails().includes(email.toLowerCase().trim())
}

export function validateAdminApiKey(apiKey: string | null | undefined): boolean {
  if (!apiKey) return false

  const expected = process.env.ADMIN_API_KEY
  if (expected) return apiKey === expected

  return process.env.NODE_ENV === 'development' && apiKey === DEV_FALLBACK_KEY
}

async function hasAdminSession(request: NextRequest): Promise<boolean> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.email) return false
  if (token.isAdmin === true) return true

  const email = token.email.toLowerCase().trim()
  return isAdminUser(email, token.userType as string | undefined)
}

export async function requireAdmin(
  request: NextRequest,
  options?: { apiKey?: string | null }
): Promise<NextResponse | null> {
  if (options?.apiKey && validateAdminApiKey(options.apiKey)) {
    return null
  }

  const headerKey = request.headers.get('x-admin-api-key')
  if (validateAdminApiKey(headerKey)) {
    return null
  }

  if (await hasAdminSession(request)) {
    return null
  }

  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
}
