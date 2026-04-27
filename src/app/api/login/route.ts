import { adminAuth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const adminAuthInstance = adminAuth();
    const sessionCookie = await adminAuthInstance.createSessionCookie(token, { expiresIn });
    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: false, // Changed to false for both production and development
      path: '/',
    };

    (await cookies()).set(options);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session cookie', details: error.message }, { status: 500 });
  }
}
