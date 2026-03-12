import { NextResponse } from 'next/server';
import { verifyJWT, fetchUserById, fetchUserProfile } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch fresh user data to ensure they are still active
    const user = await fetchUserById(payload.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // Fetch profile
    const profile = await fetchUserProfile(user.id, user.role);

    return NextResponse.json({
      message: 'Token login successful',
      token, // Return the same token or could issue a new one if needed
      user,
      profile,
    });
  } catch (error: any) {
    console.error('Token login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
