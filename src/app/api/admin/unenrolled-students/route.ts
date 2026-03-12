import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: List students who are NOT enrolled in any class for the current academic year
export async function GET() {
  try {
    // 1. Get current academic year
    const { data: academicYear, error: yearError } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    if (yearError || !academicYear) {
      return NextResponse.json(
        { error: 'No current academic year found. Please set one up.' },
        { status: 400 }
      );
    }

    // 2. Get student IDs already enrolled in the current academic year
    const { data: enrolledRows, error: enrolledError } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('academic_year_id', academicYear.id);

    if (enrolledError) {
      console.error('Error fetching enrollments:', enrolledError);
      return NextResponse.json({ error: enrolledError.message }, { status: 400 });
    }

    const enrolledStudentIds = (enrolledRows ?? []).map((r: any) => r.student_id);

    // 3. Fetch all students whose ID is NOT in the enrolled list
    //    Same select shape as GET /admin/students
    let query = supabase
      .from('students')
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

    if (enrolledStudentIds.length > 0) {
      query = query.not('id', 'in', `(${enrolledStudentIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching unenrolled students:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unenrolled students fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
