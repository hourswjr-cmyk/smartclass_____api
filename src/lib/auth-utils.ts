import { jwtVerify, JWTPayload } from 'jose';
import { supabase } from './supabase';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_to_be_replaced_in_env'
);

export interface UserPayload extends JWTPayload {
  id: number;
  email: string;
  role: string;
}

export async function verifyJWT(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as UserPayload;
  } catch (error) {
    console.error('JWT Verification failed:', error);
    return null;
  }
}

export async function fetchUserById(id: number) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, role, avatar_url, is_active, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function fetchUserProfile(userId: number, role: string) {
  let table = '';
  if (role === 'student') table = 'students';
  else if (role === 'teacher') table = 'teachers';
  else if (role === 'parent') table = 'parents';

  if (!table) return null;

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return { type: role, data };
}
