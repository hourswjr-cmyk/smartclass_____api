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
    } = body;

    // 1. Validation
    if (!email || !password || !full_name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields (email, password, full_name, phone)' },
        { status: 400 }
      );
    }

    // 2. Auto-generate Student Code
    // Format: STU-YYYY-RANDOM (e.g. STU-2026-1234)
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const student_code = `STU-${year}-${random}`;



    // 4. Insert into public.users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          phone, 
          full_name, 
          password, 
          role: 'student',
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

    // 5. Insert into public.students
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert([
        {
          user_id: userId,
          student_code,
          full_name,
          enrollment_date: new Date().toISOString().split('T')[0],
          status: 'active'
        }
      ])
      .select('*')
      .single();

    if (studentError) {
      console.error('Student profile creation error:', studentError);
      // Clean up user if student profile fails (optional improvement)
      await supabase.from('users').delete().eq('id', userId);
      
      return NextResponse.json(
        { error: 'User created but failed to create student profile' },
        { status: 500 }
      );
    }

    // 6. Return Success with student info
    return NextResponse.json({
      message: 'Student created successfully',
      student: student,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Admin student creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
