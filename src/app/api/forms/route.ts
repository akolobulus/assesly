
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryParam = searchParams.get('category') as 'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null;

  try {
    const db = adminDb();
    const publicFormsCol = db.collection('publicForms');
    
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

    if (categoryParam) {
      const validCategories = ['Funding', 'Equipment', 'Discount', 'Opportunities'];
      if (!validCategories.includes(categoryParam)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      query = publicFormsCol.where('formCategory', '==', categoryParam).orderBy('publishedAt', 'desc');
    } else {
      query = publicFormsCol.orderBy('publishedAt', 'desc');
    }

    const formSnapshot = await query.get();

    const publishedForms = formSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const publishedAtValue = data.publishedAt;
        
        let publishedAtISOString: string;

        if (publishedAtValue instanceof Timestamp) {
            // It's a Firestore Timestamp, convert it
            publishedAtISOString = publishedAtValue.toDate().toISOString();
        } else if (publishedAtValue) {
            // It's likely a string or JS Date object, which Date constructor can handle
            try {
              publishedAtISOString = new Date(publishedAtValue).toISOString();
            } catch (e) {
              // If parsing fails, use a fallback
              publishedAtISOString = new Date().toISOString();
            }
        } else {
            // Fallback for missing field
            publishedAtISOString = new Date().toISOString(); 
        }

        return {
            id: docSnap.id,
            formName: data.formName || "Untitled Form",
            formDescription: data.formDescription || "",
            thumbnailUrl: data.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.formName || 'Form')}`,
            metaImageUrl: data.metaImageUrl || null,
            formCategory: data.formCategory || null,
            publishedAt: publishedAtISOString,
        };
    });

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 's-maxage=60, stale-while-revalidate'
    };

    return NextResponse.json(publishedForms, { status: 200, headers });

  } catch (error: any) {
    console.error(`[API /api/forms] Error for category "${categoryParam}":`, error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message || 'An unknown error occurred while fetching forms.'
    }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
