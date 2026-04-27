
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    let wixFunctionName;
    let requestBody;

    // Determine which Wix function to call based on the collection
    if (body.collection === 'BusinessListing') {
      wixFunctionName = 'editBusinessListing';
      // The new function expects { itemId, ...updateData }
      requestBody = JSON.stringify({
        itemId: body.id,
        ...body.data,
      });
    } else {
      wixFunctionName = 'editOpportunity';
      // The generic function expects { id, collection, data }
      requestBody = JSON.stringify(body);
    }

    const response = await fetch(`https://thefounders.tech/_functions/${wixFunctionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth': process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2',
      },
      body: requestBody,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        const errorMessage = result.error || (result.body ? result.body.error : 'Failed to edit item');
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Item edited successfully',
      data: result.updatedItem || result.updated,
    });
  } catch (error) {
    console.error("API /api/editOpportunity Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while editing item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
