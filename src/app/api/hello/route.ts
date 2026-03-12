import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const isSupabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    message: "Hello World",
    supabase_configured: isSupabaseConfigured,
  });
}