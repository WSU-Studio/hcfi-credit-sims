import { NextRequest, NextResponse } from 'next/server';
import { mockApi, isMockModeEnabled, simulateDelay } from '@/lib/mock-api';

const API_BASE_URL = process.env.CREDIT_SIMULATION_API_URL || 'https://qaapigwconfins.hyundaicapital.co.id/api/mobileloan';

// Get List Manufacturing Year By Model
export async function POST(request: NextRequest) {
  // Check if mock mode is enabled
  if (isMockModeEnabled()) {
    await simulateDelay(200);
    const body = await request.json();
    const mockResponse = mockApi.getManufacturingYears({
      ModelCode: body.ModelCode,
      DealerCode: body.DealerCode,
    });
    return NextResponse.json(mockResponse);
  }

  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/Foundation/v2/AssetMasterForMobileX/GetListManufYearByModel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ModelCode: body.ModelCode,
        DealerCode: body.DealerCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.Message || 'Failed to fetch manufacturing years' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching manufacturing years:', error);
    console.log('Falling back to mock API...');
    
    // Fallback to mock API on error
    try {
      const body = await request.json();
      const mockResponse = mockApi.getManufacturingYears({
        ModelCode: body.ModelCode,
        DealerCode: body.DealerCode,
      });
      return NextResponse.json(mockResponse);
    } catch (mockError) {
      console.error('Error fetching manufacturing years:', mockError);
      return NextResponse.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
}
