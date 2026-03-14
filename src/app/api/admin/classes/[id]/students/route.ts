import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: List all students enrolled in a specific class
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get student IDs enrolled in this class via student_enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('class_id', id);

    if (enrollError) {
      return NextResponse.json({ error: enrollError.message }, { status: 400 });
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json([]);
    }

    const studentIds = enrollments.map((e: any) => e.student_id);

    // Fetch students with the same format as GET /api/admin/students
    const { data: students, error: studentsError } = await supabase
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
      .in('id', studentIds)
      .order('created_at', { ascending: false });

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 400 });
    }

    return NextResponse.json(students);
  } catch (error: any) {
    console.error('Class students fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
