import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL
  const nextAuthSecret = process.env.NEXTAUTH_SECRET
  const nextPublicGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const debug = {
    env: {
      NEXTAUTH_URL: nextAuthUrl ? '✅ Configurada' : '❌ NÃO configurada',
      NEXTAUTH_SECRET: nextAuthSecret ? '✅ Configurada' : '❌ NÃO configurada',
      GOOGLE_CLIENT_ID: googleClientId ? '✅ Configurada' : '❌ NÃO configurada',
      GOOGLE_CLIENT_SECRET: googleClientSecret ? '✅ Configurada' : '❌ NÃO configurada',
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: nextPublicGoogleClientId ? '✅ Configurada' : '❌ NÃO configurada'
    },
    truncated: {
      GOOGLE_CLIENT_ID: googleClientId ? `${googleClientId.substring(0, 10)}...` : null,
      GOOGLE_CLIENT_SECRET: googleClientSecret ? `${googleClientSecret.substring(0, 10)}...` : null,
      NEXTAUTH_URL: nextAuthUrl || null
    },
    checklist: {
      'Google Client ID configurado': !!googleClientId,
      'Google Client Secret configurado': !!googleClientSecret,
      'NextAuth URL configurada': !!nextAuthUrl,
      'NextAuth Secret configurada': !!nextAuthSecret,
      'Public Google Client ID configurado': !!nextPublicGoogleClientId,
      'Callback URL deve ser': nextAuthUrl ? `${nextAuthUrl}/api/auth/callback/google` : 'Não configurada (falta NEXTAUTH_URL)'
    },
    setup: {
      'JavaScript Origins': nextAuthUrl || 'http://localhost:3000',
      'Redirect URIs': nextAuthUrl ? `${nextAuthUrl}/api/auth/callback/google` : 'http://localhost:3000/api/auth/callback/google'
    }
  }

  return NextResponse.json(debug, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
