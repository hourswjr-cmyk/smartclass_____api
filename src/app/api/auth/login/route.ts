import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SignJWT } from 'jose';
import { fetchUserProfile } from '@/lib/auth-utils';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_to_be_replaced_in_env'
);

export async function POST(request: Request) {
  try {
    const { email, student_code, password } = await request.json();

    if ((!email && !student_code) || !password) {
      return NextResponse.json(
        { error: 'Email/Student Code and password are required' },
        { status: 400 }
      );
    }

    let userEmail = email;

    // If student_code is provided, find the user's email
    if (student_code) {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('users(email)')
        .eq('student_code', student_code)
        .single();
      if (studentError || !student || !student.users) {
        return NextResponse.json(
          { error: 'Invalid student code' },
          { status: 401 }
        );
      }
      userEmail = (student.users as any).email;
    }

    // 1. Fetch user from Supabase
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (fetchError || !user) {
      console.log(fetchError);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 2. Verify password
    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // 3. Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // 4. Generate JWT
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // 5. Fetch profile info based on role
    const profile = await fetchUserProfile(user.id, user.role);

    // 6. Return success (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
      profile,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
