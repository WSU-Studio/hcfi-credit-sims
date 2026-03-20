import { NextResponse } from 'next/server';

/**
 * Lightweight health check for ELB/ALB.
 * No DB, no heavy logic - fast 200 response.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
