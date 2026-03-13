import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Get a single student by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        users:user_id (
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
      console.error('Error fetching student:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Student fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update student profiles and user details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Separate fields for students and users tables
    const studentFields = [
      'full_name', 'date_of_birth', 'gender', 'address', 
      'medical_history', 'allergies', 'emergency_contact_name', 
      'emergency_contact_phone', 'photo_url', 'status', 'student_code'
    ];
    
    const userFields = [
      'email', 'phone', 'full_name', 'avatar_url', 'is_active', 'password'
    ];

    const studentUpdate: any = {};
    const userUpdate: any = {};

    Object.keys(body).forEach(key => {
      if (studentFields.includes(key)) studentUpdate[key] = body[key];
      if (userFields.includes(key)) userUpdate[key] = body[key];
    });

    // 1. Get user_id first
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const userId = student.user_id;

    // 2. Update students table
    if (Object.keys(studentUpdate).length > 0) {
      const { error: studentError } = await supabase
        .from('students')
        .update(studentUpdate)
        .eq('id', id);

      if (studentError) {
        return NextResponse.json({ error: studentError.message }, { status: 400 });
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

    return NextResponse.json({ message: 'Student updated successfully' });
  } catch (error: any) {
    console.error('Student update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove student and their user account with cascading cleanup
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Get user_id first
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const userId = student.user_id;

    // 2. Cascading cleanup of related records
    // We do this in order of child tables to avoid FK violations
    
    // Cleanup Student Parents relationship
    await supabase.from('student_parents').delete().eq('student_id', id);
    
    // Cleanup Enrollments
    await supabase.from('student_enrollments').delete().eq('student_id', id);
    
    // Cleanup Academic History
    await supabase.from('attendance').delete().eq('student_id', id);
    await supabase.from('grade_entries').delete().eq('student_id', id);
    await supabase.from('assignment_submissions').delete().eq('student_id', id);
    
    // Cleanup Financial History
    // First find related student fees to clean up payments if any (though fee_payments uses student_fee_id)
    const { data: fees } = await supabase.from('student_fees').select('id').eq('student_id', id);
    if (fees && fees.length > 0) {
      const feeIds = fees.map(f => f.id);
      await supabase.from('fee_payments').delete().in('student_fee_id', feeIds);
    }
    await supabase.from('student_fees').delete().eq('student_id', id);
    await supabase.from('invoices').delete().eq('student_id', id);
    
    // Cleanup Logs
    await supabase.from('activity_logs').delete().eq('student_id', id);

    // 3. Delete from students table
    const { error: studentDeleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (studentDeleteError) {
      return NextResponse.json({ error: studentDeleteError.message }, { status: 400 });
    }

    // 4. Delete from users table
    if (userId) {
      const { error: userDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userDeleteError) {
        return NextResponse.json({ 
          message: 'Student record and history deleted, but failed to delete user account',
          error: userDeleteError.message 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ message: 'Student, historical records, and user account deleted successfully' });
  } catch (error: any) {
    console.error('Student deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
