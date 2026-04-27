
import { NextRequest, NextResponse } from 'next/server';

const WIX_FUNCTION_URL = 'https://thefounders.tech/_functions/userGeneratedCollection';
const ALL_COLLECTIONS = ['Grants', 'EquipmentsCollection', 'DiscountsCollection', 'OpportunityCollections'];

// This function fetches user-generated collections from a Wix function
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const specificCollection = searchParams.get('collection');

    const collectionsToFetch = specificCollection ? [specificCollection] : ALL_COLLECTIONS;

    const fetchPromises = collectionsToFetch.map(async (collectionName) => {
        let url = `${WIX_FUNCTION_URL}?collection=${collectionName}`;
        if (userId) {
            url += `&userId=${userId}`;
        }
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'auth': process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2',
                },
                cache: 'no-store', // Ensure fresh data on each request
            });

            if (!response.ok) {
                console.warn(`[API /api/user-generated-opportunities] Failed to fetch collection ${collectionName}: ${response.statusText}`);
                return [];
            }
            
            const result = await response.json();
            return (result.items || []).map((item: any) => ({ ...item, collection: collectionName }));

        } catch (fetchError) {
            console.error(`[API /api/user-generated-opportunities] Error fetching collection ${collectionName}:`, fetchError);
            return [];
        }
    });

    const results = await Promise.all(fetchPromises);
    const allItems = results.flat();

    return NextResponse.json({
      success: true,
      data: allItems,
    });

  } catch (error) {
    console.error('User-Generated Opportunities API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while fetching opportunities',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
