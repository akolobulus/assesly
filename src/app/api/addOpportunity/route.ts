
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    let wixFunctionUrl: string;
    let requestBody: any;

    if (body.collection === 'BusinessListing') {
      wixFunctionUrl = `https://thefounders.tech/_functions/addBusinessListing`;
      // The new function expects the data object directly.
      requestBody = JSON.stringify(body.data);
    } else {
      wixFunctionUrl = `https://thefounders.tech/_functions/addOpportunity`;
      // The old function expected the data directly in the body.
      requestBody = JSON.stringify(body.data);
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
        // Handle potential Wix error format where success flag might not be present on failure
        const errorMessage = result.error || (result.body ? result.body.error : 'Failed to add item');
        console.error("Wix API Error:", errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
    
    // For Wix `created()` response, success is implicit. Check for inserted item.
    if (result.inserted) {
      return NextResponse.json({
        success: true,
        message: 'Item added successfully',
        data: result.inserted,
      });
    }

    // Fallback for other success responses
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Item added successfully',
        data: result,
      });
    }
    
    // If no success/inserted key, assume error based on previous check
    const errorMessage = result.error || 'An unknown error occurred during the Wix function execution.';
    return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
    );

  } catch (error) {
    console.error("API /api/addOpportunity Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while adding item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
