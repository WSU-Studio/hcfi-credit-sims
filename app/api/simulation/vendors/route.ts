import { NextRequest, NextResponse } from 'next/server';
import { mockApi, isMockModeEnabled, simulateDelay } from '@/lib/mock-api';

const API_BASE_URL = process.env.CREDIT_SIMULATION_API_URL || 'https://qaapigwconfins.hyundaicapital.co.id/api/mobileloan';

// Get List Vendor And Vendor City
export async function POST(request: NextRequest) {
  // Check if mock mode is enabled
  if (isMockModeEnabled()) {
    await simulateDelay(300);
    const body = await request.json();
    const mockResponse = mockApi.getVendorsAndCities({
      hasAvailableAssetOnly: body.hasAvailableAssetOnly ?? true,
      hasCmoAssignedOnly: body.hasCmoAssignedOnly ?? true,
    });
    return NextResponse.json(mockResponse);
  }

  let timeoutId: NodeJS.Timeout | null = null;
  
  try {
    const body = await request.json();

    // Increase timeout for API calls (30 seconds)
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}/Foundation/v1/VendorObX/GetListVendorAndVendorCity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hasAvailableAssetOnly: body.hasAvailableAssetOnly ?? true,
        hasCmoAssignedOnly: body.hasCmoAssignedOnly ?? true,
      }),
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.Message || 'Failed to fetch vendors' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    
    console.error('Error fetching vendors:', error);
    console.log('Falling back to mock API...');
    
    // Fallback to mock API on error
    try {
      const body = await request.json();
      const mockResponse = mockApi.getVendorsAndCities({
        hasAvailableAssetOnly: body.hasAvailableAssetOnly ?? true,
        hasCmoAssignedOnly: body.hasCmoAssignedOnly ?? true,
      });
      return NextResponse.json(mockResponse);
    } catch (mockError) {
      return NextResponse.json(
        { 
          error: 'Internal server error', 
          message: error.message,
        },
        { status: 500 }
      );
    }
  }
}
