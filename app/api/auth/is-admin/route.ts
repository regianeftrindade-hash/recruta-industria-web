import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { hasAdminAccess } from '@/lib/auth/admin-auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  return NextResponse.json({
    isAdmin: hasAdminAccess({
      isAdmin: session?.user?.isAdmin,
      email: session?.user?.email,
      role: session?.user?.userType,
    }),
    email: session?.user?.email ?? null,
  });
}
