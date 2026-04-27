
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`https://thefounders.tech/_functions/deleteInvestor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth': process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete investor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Investor deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Server error while deleting investor',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
