import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch a single academic year
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update an academic year
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { year_name, start_date, end_date, is_current } = body;

    // If marking as current, unset others first
    if (is_current === true) {
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('is_current', true);
    }

    const { data, error } = await supabase
      .from('academic_years')
      .update({ year_name, start_date, end_date, is_current })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove an academic year
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('academic_years')
      .delete()
      .eq('id', id);

    if (error) {
      // Common error: foreign key constraint if data exists for this year
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete academic year as it has linked data (classes, enrollments, etc.)' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Academic year deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
