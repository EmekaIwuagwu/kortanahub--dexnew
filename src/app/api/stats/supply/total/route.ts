import { NextResponse } from 'next/server';
import { getSupplyMetrics } from '@/lib/stats-engine';

export async function GET() {
  const { total } = getSupplyMetrics();
  // Return plain number as text, standard for trackers
  return new NextResponse(total.toString(), {
    headers: { 'Content-Type': 'text/plain' },
  });
}
