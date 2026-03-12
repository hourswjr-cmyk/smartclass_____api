import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /api/admin/* routes
  if (pathname.startsWith('/api/admin')) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Role-based authorization
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access only' },
        { status: 403 }
      );
    }

    // In Next.js middleware, you can pass data to the route via headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.id.toString());
    requestHeaders.set('x-user-role', payload.role as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};
