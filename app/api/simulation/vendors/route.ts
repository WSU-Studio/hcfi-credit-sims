import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.CREDIT_SIMULATION_API_URL || 'https://qaapigwconfins.hyundaicapital.co.id/api/mobileloan';

// Get List Vendor And Vendor City
export async function POST(request: NextRequest) {
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
    console.error('API URL:', API_BASE_URL);
    
    // Check if it's a timeout or connection error
    if (
      error.name === 'AbortError' || 
      error.code === 'UND_ERR_CONNECT_TIMEOUT' || 
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('timeout')
    ) {
      return NextResponse.json(
        { 
          error: 'Connection timeout',
          message: 'Tidak dapat terhubung ke server API. Pastikan Anda terhubung ke VPN atau network yang tepat.',
          details: `API URL: ${API_BASE_URL}`,
          suggestion: 'Periksa koneksi VPN atau pastikan API URL benar di environment variables (CREDIT_SIMULATION_API_URL)',
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        details: `API URL: ${API_BASE_URL}`,
      },
      { status: 500 }
    );
  }
}
