
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing itemId' },
        { status: 400 }
      );
    }
    
    const wixFunctionUrl = `https://thefounders.tech/_functions/removeBusinessListing`;
    const requestBody = JSON.stringify({ itemId: itemId }); 

    const response = await fetch(wixFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth': process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2',
      },
      body: requestBody,
    });
    
    const result = await response.json();

    if (!response.ok || result.success === false) {
      const errorMessage = result.error || 'Failed to delete business listing from Wix';
      console.error('Wix Deletion Error:', errorMessage);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Business listing deleted successfully',
      data: result,
    });

  } catch (error) {
    console.error('Delete Business Listing API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while deleting business listing',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
