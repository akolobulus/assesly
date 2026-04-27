
import { NextResponse } from 'next/server';
import { getPublicFormById } from '@/lib/services/formService';

export async function GET(
  request: Request,
  { params }: { params: { formId: string } }
) {
  const { formId } = params;
  const userAgent = request.headers.get('user-agent') || undefined;

  if (!formId) {
    return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
  }

  try {
    const result = await getPublicFormById(formId, userAgent);

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    switch (result.status) {
      case 'available':
        // Return the public data of the form
        return NextResponse.json(result.data, { status: 200, headers });
      case 'unavailable':
        return NextResponse.json({ error: 'Form not found or not available.' }, { status: 404, headers });
      case 'closed':
        return NextResponse.json({ error: 'This form is manually closed and not accepting submissions.' }, { status: 403, headers });
      case 'not-yet-open':
          return NextResponse.json({ error: 'This form is not yet open for submissions.' }, { status: 403, headers });
      case 'closed-by-schedule':
          return NextResponse.json({ error: 'This form has closed due to its schedule.' }, { status: 403, headers });
      case 'limit-reached':
          return NextResponse.json({ error: 'This form has reached its submission limit.' }, { status: 403, headers });
      default:
        return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500, headers });
    }
  } catch (error: any) {
    console.error(`[API /api/forms/${formId}] Error:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// Add an OPTIONS method handler for CORS preflight requests
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
