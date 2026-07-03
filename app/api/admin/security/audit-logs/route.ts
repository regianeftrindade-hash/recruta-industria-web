import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'
import { requireAdmin } from '@/lib/admin-auth'

const AUDIT_LOGS_FILE = path.join(process.cwd(), 'data', 'audit_logs.json')

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const content = await fs.readFile(AUDIT_LOGS_FILE, 'utf-8')
    const logs = JSON.parse(content || '[]')

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const eventFilter = searchParams.get('event')
    const userFilter = searchParams.get('user')

    let filtered = logs
    if (eventFilter) {
      filtered = filtered.filter((log: any) => log.event === eventFilter)
    }
    if (userFilter) {
      filtered = filtered.filter((log: any) => log.userId === userFilter)
    }

    // Sort by timestamp descending
    filtered.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json(filtered.slice(0, limit))
  } catch (error) {
    console.error('Error reading audit logs:', error)
    return NextResponse.json({ logs: [] })
  }
}
