import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: List classes that have enough capacity for `amount` more students
// Query param: amount (required) — number of students to enroll
// Example: GET /api/admin/classes/available?amount=5
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const amountParam = searchParams.get('amount');

    if (!amountParam) {
      return NextResponse.json(
        { error: 'Query parameter "amount" is required' },
        { status: 400 }
      );
    }

    const amount = parseInt(amountParam, 10);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: '"amount" must be a positive integer' },
        { status: 400 }
      );
    }

    // Fetch all classes with their academic year info
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*, academic_years(*)')
      .order('name', { ascending: true });

    if (classesError) {
      return NextResponse.json({ error: classesError.message }, { status: 400 });
    }

    // Fetch enrollment counts per class
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_enrollments')
      .select('class_id');

    if (enrollmentsError) {
      return NextResponse.json({ error: enrollmentsError.message }, { status: 400 });
    }

    // Build a map of class_id -> enrolled student count
    const enrollmentCountMap: Record<string, number> = {};
    for (const row of enrollments ?? []) {
      const cid = row.class_id;
      enrollmentCountMap[cid] = (enrollmentCountMap[cid] ?? 0) + 1;
    }

    // Filter classes where remaining capacity >= amount
    const availableClasses = (classes ?? []).filter((cls) => {
      const capacity = cls.capacity ?? 0;
      const enrolled = enrollmentCountMap[cls.id] ?? 0;
      const remaining = capacity - enrolled;
      return remaining >= amount;
    });

    return NextResponse.json(availableClasses);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
