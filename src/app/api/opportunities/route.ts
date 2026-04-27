// app/api/opportunities/route.ts
import { NextRequest, NextResponse } from 'next/server';
 
const COLLECTION_NAMES = [
  'Grants',
  'EquipmentsCollection',
  'DiscountsCollection',
  'OpportunityCollections'
];

interface WixOpportunity {
  _id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  applicationStatus: string;
  applicationType: string;
  submittedAt: string;
  _createdDate: string;
  _updatedDate: string;
  _owner: string;
}

interface OpportunityWithCollection extends WixOpportunity {
  collection: string;
}

async function fetchFromWix(collection: string): Promise<WixOpportunity[]> {
  try {
    const response = await fetch(`https://thefounders.tech/_functions/allCollection?collection=${collection}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'auth': process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${collection}:`, response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data?.items || [];
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionFilter = searchParams.get('collection');

    const collectionsToFetch = collectionFilter
      ? COLLECTION_NAMES.filter(name => name === collectionFilter)
      : COLLECTION_NAMES;

    const fetchPromises = collectionsToFetch.map(async (collection) => {
      const opportunities = await fetchFromWix(collection);
      return opportunities.map((opportunity): OpportunityWithCollection => ({
        ...opportunity,
        collection,
      }));
    });

    const results = await Promise.all(fetchPromises);
    const allOpportunities = results.flat();

    allOpportunities.sort((a, b) =>
      new Date(b._createdDate).getTime() - new Date(a._createdDate).getTime()
    );

    return NextResponse.json({
      success: true,
      data: allOpportunities,
      count: allOpportunities.length,
    });

  } catch (error) {
    console.error('Error in opportunities API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch opportunities',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection, id } = body;

    if (!collection || !id) {
      return NextResponse.json(
        { success: false, error: 'Missing collection or id' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://thefounders.tech/_functions/deleteOpportunity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth': process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2',
      },
      body: JSON.stringify({ collection, id }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Wix Deletion Error:', result);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete opportunity' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunity deleted successfully',
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while deleting opportunity',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}