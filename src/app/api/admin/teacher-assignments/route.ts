import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: List all teacher-class-subject assignments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const classId = searchParams.get('class_id');
    const subjectId = searchParams.get('subject_id');
    const academicYearId = searchParams.get('academic_year_id');

    let query = supabase
      .from('teacher_class_subjects')
      .select(`
        id,
        is_primary,
        assigned_at,
        teacher:teachers!inner(id, full_name, employee_code, users:users!inner(email, avatar_url)),
        class:classes!inner(id, name, grade_level),
        subject:subjects!inner(id, name, code),
        academic_year:academic_years!inner(id, year_name, is_current)
      `)
      .order('assigned_at', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (classId) query = query.eq('class_id', classId);
    if (subjectId) query = query.eq('subject_id', subjectId);
    if (academicYearId) query = query.eq('academic_year_id', academicYearId);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching teacher assignments:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Flatten nested objects for easier frontend consumption
    const formattedData = data.map((item: any) => ({
      id: item.id,
      is_primary: item.is_primary,
      assigned_at: item.assigned_at,
      teacher: {
        id: item.teacher.id,
        full_name: item.teacher.full_name,
        employee_code: item.teacher.employee_code,
        email: item.teacher.users?.email,
        avatar_url: item.teacher.users?.avatar_url
      },
      class: item.class,
      subject: item.subject,
      academic_year: item.academic_year
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('Teacher assignments fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new teacher-class-subject assignment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teacher_id, class_id, subject_id, academic_year_id = 2, is_primary = true } = body;

    // 1. Validation
    if (!teacher_id || !class_id || !subject_id || !academic_year_id) {
      return NextResponse.json(
        { error: 'Missing required fields (teacher_id, class_id, subject_id, academic_year_id)' },
        { status: 400 }
      );
    }

    // 2. Check for duplicates
    const { data: existing, error: checkError } = await supabase
      .from('teacher_class_subjects')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('class_id', class_id)
      .eq('subject_id', subject_id)
      .eq('academic_year_id', academic_year_id)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 400 });
    }

    if (existing) {
      return NextResponse.json(
        { error: 'This teacher is already assigned to this subject for this class in the specified academic year.' },
        { status: 409 }
      );
    }

    // 3. Insert new assignment
    const { data: newAssignment, error: insertError } = await supabase
      .from('teacher_class_subjects')
      .insert([
        {
          teacher_id,
          class_id,
          subject_id,
          academic_year_id,
          is_primary
        }
      ])
      .select(`
        id,
        is_primary,
        assigned_at,
        teacher:teachers!inner(id, full_name, employee_code, users:users!inner(email, avatar_url)),
        class:classes!inner(id, name, grade_level),
        subject:subjects!inner(id, name, code),
        academic_year:academic_years!inner(id, year_name, is_current)
      `)
      .single();

    if (insertError) {
      console.error('Assignment creation error:', insertError);
      return NextResponse.json(
        { error: insertError.message || 'Failed to create assignment' },
        { status: 400 }
      );
    }

    // Format the response to match the GET format
    const formattedData = {
      id: newAssignment.id,
      is_primary: newAssignment.is_primary,
      assigned_at: newAssignment.assigned_at,
      teacher: {
        id: (newAssignment.teacher as any).id,
        full_name: (newAssignment.teacher as any).full_name,
        employee_code: (newAssignment.teacher as any).employee_code,
        email: (newAssignment.teacher as any).users?.email,
        avatar_url: (newAssignment.teacher as any).users?.avatar_url
      },
      class: newAssignment.class,
      subject: newAssignment.subject,
      academic_year: newAssignment.academic_year
    };

    return NextResponse.json(formattedData, { status: 201 });

  } catch (error: any) {
    console.error('Admin assignment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
