import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch a single class with its academic year
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('classes')
      .select('*, academic_years(*)')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update a class
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, grade_level, academic_year_id, capacity } = body;

    const { data, error } = await supabase
      .from('classes')
      .update({ name, grade_level, academic_year_id, capacity })
      .eq('id', id)
      .select('*, academic_years(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a class
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      // Handle foreign key constraints (e.g., if students are enrolled)
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete class as it has linked data (students, enrollments, etc.)' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
