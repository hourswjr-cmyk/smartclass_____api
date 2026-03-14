import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: List all classes with their academic years, student count, and subjects
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        academic_years(*),
        student_enrollments(count),
        teacher_class_subjects(
          subjects(name)
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Reshape: add student_count and subjects fields
    const formatted = (data as any[]).map((cls) => {
      // student_count comes from student_enrollments aggregate
      const student_count = cls.student_enrollments?.[0]?.count ?? 0;

      // Flatten subjects: unique names only
      const subjectNames: string[] = [];
      const seen = new Set<string>();
      (cls.teacher_class_subjects || []).forEach((tcs: any) => {
        const name = tcs.subjects?.name;
        if (name && !seen.has(name)) {
          seen.add(name);
          subjectNames.push(name);
        }
      });

      const { student_enrollments, teacher_class_subjects, ...rest } = cls;

      return {
        ...rest,
        student_count,
        subjects: subjectNames,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new class
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, grade_level, academic_year_id, capacity } = body;

    if (!name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('classes')
      .insert([{ 
        name, 
        grade_level, 
        academic_year_id, 
        capacity: capacity || 40 
      }])
      .select('*, academic_years(*)')
      .single();

    if (error) {
       console.error('Error creating class:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
