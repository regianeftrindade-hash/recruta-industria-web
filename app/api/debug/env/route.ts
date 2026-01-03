import { NextResponse } from 'next/server'

export async function GET() {
  // This endpoint is only available in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    message: 'Debug endpoint - development only',
  })
}
