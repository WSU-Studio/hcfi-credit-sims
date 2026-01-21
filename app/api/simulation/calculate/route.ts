import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.CREDIT_SIMULATION_API_URL || 'https://qaapigwconfins.hyundaicapital.co.id/api/mobileloan';

// Get List Product From Rule By LeadNo (With Calculation)
// Note: This requires a LeadNo which should be created first
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.LeadNo) {
      return NextResponse.json(
        { error: 'LeadNo is required for calculation' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/v1/IntegrationWebsite/GetListProductFromRuleByLeadNo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        LeadNo: body.LeadNo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.Message || 'Failed to calculate products' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error calculating products:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
