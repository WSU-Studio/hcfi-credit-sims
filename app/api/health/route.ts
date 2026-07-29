import { NextResponse } from 'next/server';
import { CACHE_NO_STORE } from '@/lib/security/cache-headers';

/**
 * Lightweight health check for ELB/ALB.
 * No DB, no heavy logic - fast 200 response.
 */
export async function GET() {
  return NextResponse.json(
    { status: 'ok' },
    {
      status: 200,
      headers: {
        'Cache-Control': CACHE_NO_STORE,
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}
