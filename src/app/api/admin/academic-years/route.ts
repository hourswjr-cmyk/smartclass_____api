import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: List all academic years
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new academic year
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year_name, start_date, end_date, is_current } = body;

    if (!year_name) {
      return NextResponse.json({ error: 'Year name is required' }, { status: 400 });
    }

    // If marked as current, unset any other current year
    if (is_current) {
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('is_current', true);
    }

    const { data, error } = await supabase
      .from('academic_years')
      .insert([{ year_name, start_date, end_date, is_current: !!is_current }])
      .select()
      .single();

    if (error) {
       console.error('Error creating academic year:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
