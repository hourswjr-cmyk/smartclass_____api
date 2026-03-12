import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: List all subjects
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new subject
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    // 1. Auto-generate Subject Code
    // Format: PRE-001 (prefix is first 3 letters of name)
    const prefix = name.substring(0, 3).toUpperCase();
    
    // Find the highest existing sequence number for this prefix
    const { data: existingSubjects, error: searchError } = await supabase
      .from('subjects')
      .select('code')
      .like('code', `${prefix}-%`)
      .order('code', { ascending: false })
      .limit(1);

    if (searchError) {
      console.error('Error searching for existing subject codes:', searchError);
    }

    let nextNumber = 1;
    if (existingSubjects && existingSubjects.length > 0) {
      const lastCode = existingSubjects[0].code;
      const match = lastCode.match(new RegExp(`${prefix}-(\\d+)`));
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const generatedCode = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;

    const { data, error } = await supabase
      .from('subjects')
      .insert([{ name, code: generatedCode }])
      .select()
      .single();

    if (error) {
       console.error('Error creating subject:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Internal server error creating subject:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
