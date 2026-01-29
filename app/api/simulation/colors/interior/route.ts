import { NextRequest, NextResponse } from 'next/server';
import { mockApi, isMockModeEnabled, simulateDelay } from '@/lib/mock-api';

const API_BASE_URL = process.env.CREDIT_SIMULATION_API_URL || 'https://qaapigwconfins.hyundaicapital.co.id/api/mobileloan';

// Get List Interior Color By FSC Code, Manufacturing Year, and Exterior Color
export async function POST(request: NextRequest) {
  // Check if mock mode is enabled
  if (isMockModeEnabled()) {
    await simulateDelay(200);
    const body = await request.json();
    const mockResponse = mockApi.getInteriorColors({
      FscCode: body.FscCode,
      ManufYear: body.ManufYear,
      ExtColorCode: body.ExtColorCode,
    });
    return NextResponse.json(mockResponse);
  }

  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/Foundation/v1/AssetMasterForMobileX/GetListInteriorColorByFscManufYearExtColor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        FscCode: body.FscCode,
        ManufYear: body.ManufYear,
        ExtColorCode: body.ExtColorCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.Message || 'Failed to fetch interior colors' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching interior colors:', error);
    console.log('Falling back to mock API...');
    
    // Fallback to mock API on error
    try {
      const body = await request.json();
      const mockResponse = mockApi.getInteriorColors({
        FscCode: body.FscCode,
        ManufYear: body.ManufYear,
        ExtColorCode: body.ExtColorCode,
      });
      return NextResponse.json(mockResponse);
    } catch (mockError) {
      console.error('Error fetching interior colors:', mockError);
      return NextResponse.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
}
