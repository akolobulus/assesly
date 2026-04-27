
'use server';

import { NextResponse } from 'next/server';
import { sendInvitationEmail } from '@/lib/services/emailService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, inviterName, formName, formLink } = body;

    if (!to || !inviterName || !formName || !formLink) {
      return NextResponse.json({ error: 'Missing required fields for invitation email.' }, { status: 400 });
    }

    const result = await sendInvitationEmail({ to, inviterName, formName, formLink });

    if (result.success) {
      return NextResponse.json({ message: 'Invitation email sent successfully.' }, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error || 'Failed to send invitation email.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[API /api/send-invitation] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
 
