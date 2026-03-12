import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      full_name, 
      phone,
      role,
      // Student specific
      student_code,
      // Parent specific
      relationship
    } = body;

    // 1. Basic Validation
    if (!email || !password || !full_name || !phone || !role) {
      return NextResponse.json(
        { error: 'Missing required fields (email, password, full_name, phone, role)' },
        { status: 400 }
      );
    }

    if (role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can self-register. Students must be created by an admin.' },
        { status: 400 }
      );
    }



    // 3. Insert into public.users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          phone, 
          full_name, 
          password, 
          role,
          is_active: true
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: userError.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    const userId = user.id;

    // 4. Insert into role-specific table (Parent only now)
    const { error: parentError } = await supabase
      .from('parents')
      .insert([
        {
          user_id: userId,
          full_name,
          relationship: relationship || 'guardian'
        }
      ]);

    if (parentError) {
      console.error('Parent profile creation error:', parentError);
      return NextResponse.json(
        { error: 'User created but failed to create parent profile' },
        { status: 500 }
      );
    }

    // 5. Return Success
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      message: 'Sign up successful',
      user: userWithoutPassword
    });

  } catch (error: any) {
    console.error('Sign-up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
