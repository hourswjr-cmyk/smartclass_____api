import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Fetch a single teacher by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching teacher:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Teacher fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update teacher profiles and user details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Separate fields for teachers and users tables
    const teacherFields = [
      'full_name', 'department', 'joining_date', 'is_class_teacher', 'employee_code'
    ];
    
    const userFields = [
      'email', 'phone', 'full_name', 'avatar_url', 'is_active', 'password'
    ];

    const teacherUpdate: any = {};
    const userUpdate: any = {};

    Object.keys(body).forEach(key => {
      if (teacherFields.includes(key)) teacherUpdate[key] = body[key];
      if (userFields.includes(key)) userUpdate[key] = body[key];
    });

    // 1. Get user_id first
    const { data: teacher, error: fetchError } = await supabase
      .from('teachers')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const userId = teacher.user_id;

    // 2. Update teachers table
    if (Object.keys(teacherUpdate).length > 0) {
      const { error: teacherError } = await supabase
        .from('teachers')
        .update(teacherUpdate)
        .eq('id', id);

      if (teacherError) {
        return NextResponse.json({ error: teacherError.message }, { status: 400 });
      }
    }

    // 3. Update users table
    if (Object.keys(userUpdate).length > 0) {
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', userId);

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ message: 'Teacher updated successfully' });
  } catch (error: any) {
    console.error('Teacher update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Soft delete (deactivate) a teacher
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Get user_id first
    const { data: teacher, error: fetchError } = await supabase
      .from('teachers')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const userId = teacher.user_id;

    // 2. Soft delete: Deactivate the user account so they can no longer log in.
    // We do NOT hard delete from teachers or users because teachers are referenced
    // by critical historical data (attendance marks, grade entries, assignments).
    const { error: deactivateError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);

    if (deactivateError) {
      return NextResponse.json({ 
        message: 'Failed to deactivate teacher account',
        error: deactivateError.message 
      }, { status: 400 });
    }
    
    // Optional cleanup: We could remove them from active class assignments so they 
    // don't show up in the current timetable, but keep historical ones. For now, 
    // simply deactivating the account is the safest approach for preserving history.
    // If we wanted to remove active assignments:
    // await supabase.from('teacher_class_subjects').delete().eq('teacher_id', id);

    return NextResponse.json({ message: 'Teacher account successfully deactivated (soft delete)' });
  } catch (error: any) {
    console.error('Teacher deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
