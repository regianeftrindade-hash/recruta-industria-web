import { NextRequest, NextResponse } from 'next/server'
import { unlockAccount } from '@/lib/security-audit'

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin
    // if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { email, unlockedBy } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    await unlockAccount(email, unlockedBy || 'admin')

    return NextResponse.json({ success: true, message: 'Account unlocked' })
  } catch (error) {
    console.error('Error unlocking account:', error)
    return NextResponse.json(
      { error: 'Failed to unlock account' },
      { status: 500 }
    )
  }
}
