import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Fetch a single teacher assignment by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching teacher assignment:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Flatten nested objects
    const formattedData = {
      id: data.id,
      is_primary: data.is_primary,
      assigned_at: data.assigned_at,
      teacher: {
        id: (data.teacher as any).id,
        full_name: (data.teacher as any).full_name,
        employee_code: (data.teacher as any).employee_code,
        email: (data.teacher as any).users?.email,
        avatar_url: (data.teacher as any).users?.avatar_url
      },
      class: data.class,
      subject: data.subject,
      academic_year: data.academic_year
    };

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('Teacher assignment fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update an assignment (e.g., change teacher or is_primary)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Fields that can be updated in an assignment
    const allowedUpdates = ['teacher_id', 'is_primary'];
    const updatePayload: any = {};

    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updatePayload[key] = body[key];
      }
    });

    if (Object.keys(updatePayload).length === 0) {
       return NextResponse.json(
        { error: 'No valid fields provided for update. Only teacher_id and is_primary can be changed.' },
        { status: 400 }
      );
    }

    // If changing teacher, check for duplicates
    if (updatePayload.teacher_id) {
       const { data: currentAssignment, error: fetchError } = await supabase
        .from('teacher_class_subjects')
        .select('class_id, subject_id, academic_year_id')
        .eq('id', id)
        .single();
        
        if (fetchError || !currentAssignment) {
           return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        const { data: existing, error: checkError } = await supabase
          .from('teacher_class_subjects')
          .select('id')
          .eq('teacher_id', updatePayload.teacher_id)
          .eq('class_id', currentAssignment.class_id)
          .eq('subject_id', currentAssignment.subject_id)
          .eq('academic_year_id', currentAssignment.academic_year_id)
          .single();
    
        if (existing) {
          return NextResponse.json(
            { error: 'This teacher is already assigned to this subject for this class in the specified academic year.' },
            { status: 409 } // Conflict
          );
        }
    }

    const { error: updateError } = await supabase
      .from('teacher_class_subjects')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Assignment updated successfully' });
  } catch (error: any) {
    console.error('Teacher assignment update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove an assignment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error: deleteError } = await supabase
      .from('teacher_class_subjects')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Assignment removed successfully' });
  } catch (error: any) {
    console.error('Teacher assignment deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
