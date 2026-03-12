import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student_ids, class_id } = body;

    if (!Array.isArray(student_ids) || student_ids.length === 0 || !class_id) {
      return NextResponse.json(
        { error: 'student_ids (non-empty array) and class_id are required' },
        { status: 400 }
      );
    }

    // 1. Verify class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // 2. Get current academic year
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

    // 3. Build enrollment records for all students
    const records = student_ids.map((student_id: string) => ({
      student_id,
      class_id,
      academic_year_id: academicYear.id,
      status: 'active',
    }));

    // 4. Bulk insert – ignore rows that already exist (duplicate enrollment)
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('student_enrollments')
      .upsert(records, { onConflict: 'student_id,class_id,academic_year_id', ignoreDuplicates: true })
      .select();

    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError);
      return NextResponse.json(
        { error: 'Failed to enroll students', details: enrollmentError.message },
        { status: 400 }
      );
    }

    const enrolledIds = (enrollments ?? []).map((e: any) => e.student_id);
    const skippedIds = student_ids.filter((id: string) => !enrolledIds.includes(id));

    // 5. Log the bulk activity
    await supabase.from('activity_logs').insert([
      {
        action: 'ENROLL_STUDENTS',
        details: {
          class_id,
          academic_year_id: academicYear.id,
          enrolled_student_ids: enrolledIds,
          skipped_student_ids: skippedIds,
          timestamp: new Date().toISOString(),
        },
      },
    ]);

    return NextResponse.json({
      message: `${enrolledIds.length} student(s) enrolled successfully`,
      enrolled_count: enrolledIds.length,
      skipped_count: skippedIds.length,
      enrolled_student_ids: enrolledIds,
      skipped_student_ids: skippedIds,   // already enrolled / duplicate
      enrollments,
    });

  } catch (error: any) {
    console.error('Enrollment route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
