import { loginUser } from '@/lib/auth-simple';
import { cookies } from 'next/headers';

export async function POST(request) {
  const { email } = await request.json();
  
  const result = await loginUser(email);
  
  if (result.success) {
    // Stocker session en cookie
    const cookieStore = await cookies();
    cookieStore.set('user-session', JSON.stringify({
      id: result.user.id,
      email: result.user.email,
      name: result.user.full_name
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 jours
    });
    
    return Response.json({ success: true, user: result.user });
  }
  
  return Response.json({ success: false, error: result.error }, { status: 400 });
}