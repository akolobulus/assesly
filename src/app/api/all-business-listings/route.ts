
import { NextRequest, NextResponse } from 'next/server';

const WIX_FUNCTION_URL = "https://thefounders.tech/_functions/queryAllBusinessListing";
const WIX_SECRET = process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(WIX_FUNCTION_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'auth': WIX_SECRET,
      },
      cache: 'no-store', // Ensure we get the latest data
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Wix API Error (${response.status}) for ${WIX_FUNCTION_URL}:`, errorText);
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `API request failed: ${response.statusText}`);
        } catch (e) {
            throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
        }
    }

    const data = await response.json();
    return NextResponse.json({
        success: true,
        data: data.items || [],
    });

  } catch (error) {
    console.error('Error in /api/all-business-listings route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch business listings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
