
import { NextRequest, NextResponse } from 'next/server';

// This function handles "rejecting" an item, which translates to deleting it.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection, itemId, deletedBy, deleteReason } = body;

    if (!collection || !itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing collection or itemId' },
        { status: 400 }
      );
    }

    let wixFunctionUrl: string;
    let requestBody: any;
    
    if (collection === 'BusinessListing') {
      // The new function for deleting business listings via a POST request
      wixFunctionUrl = `https://thefounders.tech/_functions/removeBusinessListing`;
      requestBody = JSON.stringify({ itemId: itemId }); 
    } else {
      // Use the generic function for other opportunity types
      wixFunctionUrl = `https://thefounders.tech/_functions/deleteUserCollection?collectionName=${collection}&itemId=${itemId}`;
      // Body might be empty as params are in URL, but sending for logging/future use
      requestBody = JSON.stringify({ deletedBy, deleteReason });
    }

    const response = await fetch(wixFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth': process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2',
      },
      body: requestBody,
    });

    // Check if the response from Wix is okay, otherwise parse for an error.
    if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Failed to parse Wix error response.' }));
        const errorMessage = result.error || 'Failed to delete item via Wix function.';
        console.error('Wix Deletion Error:', errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: response.status }
        );
    }
    
    const result = await response.json();

    // After a successful response, check the body for a success flag if it exists.
    if (result.success === false) {
       console.error('Wix Function reported failure:', result.error);
       return NextResponse.json(
        { success: false, error: result.error || 'The Wix function reported an error.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item rejected (deleted) successfully',
    });

  } catch (error) {
    console.error('Reject Opportunity API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while deleting item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
