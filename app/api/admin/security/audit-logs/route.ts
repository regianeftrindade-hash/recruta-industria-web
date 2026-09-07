import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getPersistedAuditLogs, getAuditLogs } from '@/lib/security/audit-store'

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const eventFilter = searchParams.get('event') || searchParams.get('action')
    const userFilter = searchParams.get('user') || searchParams.get('email')

    const persisted = await getPersistedAuditLogs({
      limit,
      action: eventFilter,
      email: userFilter,
    })

    const source = persisted.length > 0 ? persisted : getAuditLogs(limit)

    const mapped = source.map((log) => ({
      id: log.id || `mem_${log.timestamp}`,
      event: log.action,
      action: log.action,
      userId: log.email,
      email: log.email,
      ip: log.ip,
      result: log.result,
      timestamp: new Date(log.timestamp).toISOString(),
      details: {
        text: log.details,
        userAgent: log.userAgent,
        result: log.result,
      },
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Error reading audit logs:', error)
    return NextResponse.json([])
  }
}
