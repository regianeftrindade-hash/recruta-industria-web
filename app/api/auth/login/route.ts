import { NextResponse } from 'next/server'

/**
 * O login do site é o NextAuth em /api/auth/[...nextauth].
 * Esta rota antiga conferia a senha e não abria sessão.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Use o login do site.' },
    { status: 410 },
  )
}
