import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: List all classes with their academic years
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*, academic_years(*)')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
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
