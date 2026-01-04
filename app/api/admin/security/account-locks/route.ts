import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'

const LOCKS_FILE = path.join(process.cwd(), 'data', 'account_locks.json')

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin
    // if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const content = await fs.readFile(LOCKS_FILE, 'utf-8')
    const locks = JSON.parse(content || '[]')

    // Sort by lockedAt descending
    locks.sort((a: any, b: any) =>
      new Date(b.lockedAt).getTime() - new Date(a.lockedAt).getTime()
    )

    return NextResponse.json(locks)
  } catch (error) {
    console.error('Error reading account locks:', error)
    return NextResponse.json([])
  }
}
