import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: List all teachers with their user details
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        users!inner (
          email,
          phone,
          full_name,
          avatar_url,
          is_active
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teachers:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Teachers fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new teacher
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      full_name,
      phone,
      department,
      joining_date
    } = body;

    // 1. Validation
    if (!email || !password || !full_name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields (email, password, full_name, phone)' },
        { status: 400 }
      );
    }

    // 2. Auto-generate Employee Code
    // Format: EMP-YYYY-RANDOM (e.g. EMP-2026-1234)
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const employee_code = `EMP-${year}-${random}`;

    // 3. Insert into public.users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          phone, 
          full_name, 
          password, 
          role: 'teacher',
          is_active: true
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('User creation error for teacher:', userError);
      return NextResponse.json(
        { error: userError.message || 'Failed to create user account' },
        { status: 400 }
      );
    }

    const userId = user.id;

    // 4. Insert into public.teachers
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert([
        {
          user_id: userId,
          employee_code,
          full_name,
          department,
          joining_date: joining_date || new Date().toISOString().split('T')[0],
          is_class_teacher: false
        }
      ])
      .select('*')
      .single();

    if (teacherError) {
      console.error('Teacher profile creation error:', teacherError);
      
      // Clean up user if teacher profile fails (simulated transaction)
      await supabase.from('users').delete().eq('id', userId);
      
      return NextResponse.json(
        { 
            error: 'User created but failed to create teacher profile',
            details: teacherError.message,
            hint: teacherError.hint,
            details_obj: teacherError
        },
        { status: 500 }
      );
    }

    // 5. Return Success with teacher info
    return NextResponse.json({
      ...teacher,
      users: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Admin teacher creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
