
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`https://thefounders.tech/_functions/investorsCollection`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'auth': process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch investors' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.items || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while fetching investors',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
