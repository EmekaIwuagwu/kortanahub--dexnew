import { NextResponse } from 'next/server';
import { getSupplyMetrics } from '@/lib/stats-engine';

export async function GET() {
  const { circulating } = getSupplyMetrics();
  // Return plain number as text, standard for trackers
  return new NextResponse(circulating.toString(), {
    headers: { 'Content-Type': 'text/plain' },
  });
}
