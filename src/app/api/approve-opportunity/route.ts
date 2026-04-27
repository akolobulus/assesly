
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection, itemId, approvedBy } = body;

    if (!collection || !itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing collection or itemId' },
        { status: 400 }
      );
    }
    
    let wixFunctionUrl: string;
    let requestBody: any;
    
    if (collection === 'BusinessListing') {
      // Use the specific function for approving business listings
      wixFunctionUrl = 'https://thefounders.tech/_functions/approveBusinessListingStatus';
      requestBody = JSON.stringify({ itemId: itemId });
    } else {
      // Use the generic function for other opportunity types
      wixFunctionUrl = `https://thefounders.tech/_functions/userApproveStatus?collectionName=${collection}&itemId=${itemId}`;
      requestBody = JSON.stringify({ approvedBy }); // Sending approvedBy just in case it's used for logging
    }

    const response = await fetch(wixFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth': process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2',
      },
      body: requestBody,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Wix Approval Error:', result);
      const errorMessage = result.error || 'Failed to approve item';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item approved successfully',
      data: result.updatedItem || result,
    });

  } catch (error) {
    console.error('Approve Opportunity API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while approving opportunity',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
